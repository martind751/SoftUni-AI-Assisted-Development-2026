package server

import (
	"database/sql"
	"log"
	"net/http"

	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

func validShelfStatus(s string) bool {
	return s == "listened" || s == "currently_listening" || s == "want_to_listen"
}

func (h *handlers) SetShelf(c *gin.Context) {
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
		Status   string `json:"status" binding:"required"`
		Name     string `json:"name"`
		ImageURL string `json:"image_url"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status is required"})
		return
	}

	if !validShelfStatus(body.Status) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status must be listened, currently_listening, or want_to_listen"})
		return
	}

	ctx := c.Request.Context()

	_, err := h.db.ExecContext(ctx,
		`INSERT INTO shelves (user_id, entity_type, entity_id, status)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT ON CONSTRAINT uq_shelf
		 DO UPDATE SET status = $4, updated_at = now()`,
		currentUser.ID, entityType, entityID, body.Status,
	)
	if err != nil {
		log.Printf("failed to upsert shelf for user %d, %s/%s: %v", currentUser.ID, entityType, entityID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save shelf"})
		return
	}

	if body.Name != "" {
		_, err = h.db.ExecContext(ctx,
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

	c.JSON(http.StatusOK, gin.H{"status": body.Status})
}

func (h *handlers) GetShelf(c *gin.Context) {
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

	var status *string
	err := h.db.QueryRowContext(c.Request.Context(),
		`SELECT status FROM shelves WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3`,
		currentUser.ID, entityType, entityID,
	).Scan(&status)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("failed to query shelf for user %d, %s/%s: %v", currentUser.ID, entityType, entityID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get shelf"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": status})
}

func (h *handlers) DeleteShelf(c *gin.Context) {
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

	_, err := h.db.ExecContext(c.Request.Context(),
		`DELETE FROM shelves WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3`,
		currentUser.ID, entityType, entityID,
	)
	if err != nil {
		log.Printf("failed to delete shelf for user %d, %s/%s: %v", currentUser.ID, entityType, entityID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete shelf"})
		return
	}

	c.Status(http.StatusNoContent)
}
