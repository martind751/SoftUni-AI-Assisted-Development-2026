package server

import (
	"log"
	"net/http"
	"strings"

	"soundscraibe/internal/spotify"
	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

// CheckLikedSongs checks which of the given track IDs are saved in the user's library.
func (h *handlers) CheckLikedSongs(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	currentUser := u.(*user.User)

	idsParam := c.Query("ids")
	if idsParam == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ids query parameter is required"})
		return
	}

	ids := strings.Split(idsParam, ",")

	saved, err := spotify.CheckSavedTracks(c.Request.Context(), currentUser.AccessToken, ids)
	if err != nil {
		log.Printf("failed to check saved tracks for user %d: %v", currentUser.ID, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to check saved tracks"})
		return
	}

	results := make(map[string]bool, len(ids))
	for i, id := range ids {
		if i < len(saved) {
			results[id] = saved[i]
		}
	}

	c.JSON(http.StatusOK, gin.H{"results": results})
}

// SaveLikedSong saves a track to the user's library.
func (h *handlers) SaveLikedSong(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	currentUser := u.(*user.User)
	trackID := c.Param("trackId")

	if err := spotify.SaveTracks(c.Request.Context(), currentUser.AccessToken, []string{trackID}); err != nil {
		log.Printf("failed to save track %s for user %d: %v", trackID, currentUser.ID, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to save track"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// RemoveLikedSong removes a track from the user's library.
func (h *handlers) RemoveLikedSong(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	currentUser := u.(*user.User)
	trackID := c.Param("trackId")

	if err := spotify.RemoveTracks(c.Request.Context(), currentUser.AccessToken, []string{trackID}); err != nil {
		log.Printf("failed to remove track %s for user %d: %v", trackID, currentUser.ID, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to remove track"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
