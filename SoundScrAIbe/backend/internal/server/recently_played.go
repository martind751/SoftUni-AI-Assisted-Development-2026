package server

import (
	"log"
	"net/http"

	"soundscraibe/internal/spotify"
	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

// RecentlyPlayed returns the authenticated user's recently played tracks from Spotify.
func (h *handlers) RecentlyPlayed(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	currentUser := u.(*user.User)

	result, err := spotify.GetRecentlyPlayed(c.Request.Context(), currentUser.AccessToken)
	if err != nil {
		log.Printf("failed to fetch recently played for user %d: %v", currentUser.ID, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch recently played tracks"})
		return
	}

	type trackItem struct {
		ID         string   `json:"id"`
		PlayedAt   string   `json:"played_at"`
		Name       string   `json:"name"`
		Artists    []string `json:"artists"`
		Album      string   `json:"album"`
		AlbumCover string   `json:"album_cover"`
		DurationMs int      `json:"duration_ms"`
	}

	items := make([]trackItem, 0, len(result.Items))
	for _, item := range result.Items {
		artists := make([]string, 0, len(item.Track.Artists))
		for _, a := range item.Track.Artists {
			artists = append(artists, a.Name)
		}

		albumCover := ""
		if len(item.Track.Album.Images) > 0 {
			albumCover = item.Track.Album.Images[0].URL
		}

		items = append(items, trackItem{
			ID:         item.Track.ID,
			PlayedAt:   item.PlayedAt,
			Name:       item.Track.Name,
			Artists:    artists,
			Album:      item.Track.Album.Name,
			AlbumCover: albumCover,
			DurationMs: item.Track.DurationMs,
		})
	}

	c.JSON(http.StatusOK, gin.H{"items": items})
}
