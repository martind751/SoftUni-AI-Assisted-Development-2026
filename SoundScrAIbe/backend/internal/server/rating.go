package server

import (
	"database/sql"
	"log"
	"net/http"

	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

func validEntityType(t string) bool {
	return t == "track" || t == "album" || t == "artist"
}

func (h *handlers) SetRating(c *gin.Context) {
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
		Score    int    `json:"score" binding:"required,min=1,max=10"`
		Name     string `json:"name"`
		ImageURL string `json:"image_url"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "score must be between 1 and 10"})
		return
	}

	ctx := c.Request.Context()

	_, err := h.db.ExecContext(ctx,
		`INSERT INTO ratings (user_id, entity_type, entity_id, score)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT ON CONSTRAINT uq_rating
		 DO UPDATE SET score = $4, updated_at = now()`,
		currentUser.ID, entityType, entityID, body.Score,
	)
	if err != nil {
		log.Printf("failed to upsert rating for user %d, %s/%s: %v", currentUser.ID, entityType, entityID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save rating"})
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

	c.JSON(http.StatusOK, gin.H{"score": body.Score})
}

func (h *handlers) GetRating(c *gin.Context) {
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

	var score *int
	err := h.db.QueryRowContext(c.Request.Context(),
		`SELECT score FROM ratings WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3`,
		currentUser.ID, entityType, entityID,
	).Scan(&score)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("failed to query rating for user %d, %s/%s: %v", currentUser.ID, entityType, entityID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get rating"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"score": score})
}

func (h *handlers) DeleteRating(c *gin.Context) {
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
		`DELETE FROM ratings WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3`,
		currentUser.ID, entityType, entityID,
	)
	if err != nil {
		log.Printf("failed to delete rating for user %d, %s/%s: %v", currentUser.ID, entityType, entityID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete rating"})
		return
	}

	c.Status(http.StatusNoContent)
}
