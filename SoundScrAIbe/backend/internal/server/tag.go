package server

import (
	"log"
	"net/http"
	"strings"

	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

func (h *handlers) SetTags(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	currentUser := u.(*user.User)

	entityType := c.Param("entityType")
	entityID := c.Param("entityId")

	if !validEntityType(entityType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "entity_type must be track, album, or artist"})
		return
	}

	var body struct {
		Tags     []string `json:"tags" binding:"required"`
		Name     string   `json:"name"`
		ImageURL string   `json:"image_url"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tags array is required"})
		return
	}

	// Normalize tags
	normalizedTags := make([]string, 0, len(body.Tags))
	for _, t := range body.Tags {
		t = strings.TrimSpace(strings.ToLower(t))
		if t != "" {
			normalizedTags = append(normalizedTags, t)
		}
	}

	ctx := c.Request.Context()

	tx, err := h.db.BeginTx(ctx, nil)
	if err != nil {
		log.Printf("failed to begin transaction for tags: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save tags"})
		return
	}
	defer tx.Rollback()

	// Delete existing item_tags for this entity
	_, err = tx.ExecContext(ctx,
		`DELETE FROM item_tags WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3`,
		currentUser.ID, entityType, entityID,
	)
	if err != nil {
		log.Printf("failed to delete existing item_tags for user %d, %s/%s: %v", currentUser.ID, entityType, entityID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save tags"})
		return
	}

	// Insert each tag
	for _, tagName := range normalizedTags {
		// Upsert tag
		_, err = tx.ExecContext(ctx,
			`INSERT INTO tags (user_id, name) VALUES ($1, $2)
			 ON CONFLICT ON CONSTRAINT uq_tag DO NOTHING`,
			currentUser.ID, tagName,
		)
		if err != nil {
			log.Printf("failed to upsert tag %q for user %d: %v", tagName, currentUser.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save tags"})
			return
		}

		// Get tag ID
		var tagID int64
		err = tx.QueryRowContext(ctx,
			`SELECT id FROM tags WHERE user_id = $1 AND name = $2`,
			currentUser.ID, tagName,
		).Scan(&tagID)
		if err != nil {
			log.Printf("failed to get tag id for %q, user %d: %v", tagName, currentUser.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save tags"})
			return
		}

		// Insert item_tag
		_, err = tx.ExecContext(ctx,
			`INSERT INTO item_tags (user_id, entity_type, entity_id, tag_id)
			 VALUES ($1, $2, $3, $4)`,
			currentUser.ID, entityType, entityID, tagID,
		)
		if err != nil {
			log.Printf("failed to insert item_tag for user %d, %s/%s, tag %d: %v", currentUser.ID, entityType, entityID, tagID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save tags"})
			return
		}
	}

	// Upsert entity_metadata
	if body.Name != "" {
		_, err = tx.ExecContext(ctx,
			`INSERT INTO entity_metadata (entity_type, entity_id, name, image_url)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT ON CONSTRAINT uq_entity_meta
			 DO UPDATE SET name = $3, image_url = $4, updated_at = now()`,
			entityType, entityID, body.Name, body.ImageURL,
		)
		if err != nil {
			log.Printf("failed to upsert entity_metadata for %s/%s: %v", entityType, entityID, err)
		}
	}

	if err := tx.Commit(); err != nil {
		log.Printf("failed to commit tags transaction for user %d, %s/%s: %v", currentUser.ID, entityType, entityID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save tags"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tags": normalizedTags})
}

func (h *handlers) GetTags(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	currentUser := u.(*user.User)

	entityType := c.Param("entityType")
	entityID := c.Param("entityId")

	if !validEntityType(entityType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "entity_type must be track, album, or artist"})
		return
	}

	rows, err := h.db.QueryContext(c.Request.Context(),
		`SELECT t.name FROM item_tags it JOIN tags t ON t.id = it.tag_id
		 WHERE it.user_id = $1 AND it.entity_type = $2 AND it.entity_id = $3`,
		currentUser.ID, entityType, entityID,
	)
	if err != nil {
		log.Printf("failed to query tags for user %d, %s/%s: %v", currentUser.ID, entityType, entityID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get tags"})
		return
	}
	defer rows.Close()

	tags := []string{}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			log.Printf("failed to scan tag name: %v", err)
			continue
		}
		tags = append(tags, name)
	}

	c.JSON(http.StatusOK, gin.H{"tags": tags})
}

func (h *handlers) GetUserTags(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	currentUser := u.(*user.User)

	rows, err := h.db.QueryContext(c.Request.Context(),
		`SELECT id, name FROM tags WHERE user_id = $1 ORDER BY name`,
		currentUser.ID,
	)
	if err != nil {
		log.Printf("failed to query user tags for user %d: %v", currentUser.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get tags"})
		return
	}
	defer rows.Close()

	type tagItem struct {
		ID   int64  `json:"id"`
		Name string `json:"name"`
	}

	tags := []tagItem{}
	for rows.Next() {
		var t tagItem
		if err := rows.Scan(&t.ID, &t.Name); err != nil {
			log.Printf("failed to scan user tag: %v", err)
			continue
		}
		tags = append(tags, t)
	}

	c.JSON(http.StatusOK, gin.H{"tags": tags})
}
