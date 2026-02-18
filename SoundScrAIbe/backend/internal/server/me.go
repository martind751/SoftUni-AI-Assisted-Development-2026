package server

import (
	"net/http"

	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

// Me returns the authenticated user's profile data (stored at login time).
func (h *handlers) Me(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	currentUser := u.(*user.User)

	c.JSON(http.StatusOK, gin.H{
		"spotify_id":     currentUser.SpotifyID,
		"display_name":   currentUser.DisplayName,
		"avatar_url":     currentUser.AvatarURL,
		"email":          currentUser.Email,
		"country":        currentUser.Country,
		"product":        currentUser.Product,
		"follower_count": currentUser.FollowerCount,
	})
}
