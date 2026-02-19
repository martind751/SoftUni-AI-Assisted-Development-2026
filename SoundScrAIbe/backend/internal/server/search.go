package server

import (
	"log"
	"net/http"

	"soundscraibe/internal/spotify"
	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

func (h *handlers) Search(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	currentUser := u.(*user.User)

	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter 'q' is required"})
		return
	}

	types := c.DefaultQuery("types", "track,album,artist")

	result, err := spotify.Search(c.Request.Context(), currentUser.AccessToken, query, types, 10)
	if err != nil {
		log.Printf("search failed for user %d: %v", currentUser.ID, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "search failed"})
		return
	}

	// Transform response for frontend
	tracks := []gin.H{}
	if result.Tracks != nil {
		for _, t := range result.Tracks.Items {
			artists := make([]string, len(t.Artists))
			for i, a := range t.Artists {
				artists[i] = a.Name
			}
			albumCover := ""
			if len(t.Album.Images) > 0 {
				albumCover = t.Album.Images[0].URL
			}
			tracks = append(tracks, gin.H{
				"id":          t.ID,
				"name":        t.Name,
				"artists":     artists,
				"album":       t.Album.Name,
				"album_cover": albumCover,
				"duration_ms": t.DurationMs,
			})
		}
	}

	albums := []gin.H{}
	if result.Albums != nil {
		for _, a := range result.Albums.Items {
			artists := make([]string, len(a.Artists))
			for i, ar := range a.Artists {
				artists[i] = ar.Name
			}
			imageURL := ""
			if len(a.Images) > 0 {
				imageURL = a.Images[0].URL
			}
			albums = append(albums, gin.H{
				"id":           a.ID,
				"name":         a.Name,
				"artists":      artists,
				"image_url":    imageURL,
				"release_date": a.ReleaseDate,
				"album_type":   a.AlbumType,
			})
		}
	}

	artists := []gin.H{}
	if result.Artists != nil {
		for _, ar := range result.Artists.Items {
			imageURL := ""
			if len(ar.Images) > 0 {
				imageURL = ar.Images[0].URL
			}
			artists = append(artists, gin.H{
				"id":        ar.ID,
				"name":      ar.Name,
				"image_url": imageURL,
				"genres":    ar.Genres,
				"followers": ar.Followers.Total,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"tracks":  tracks,
		"albums":  albums,
		"artists": artists,
	})
}
