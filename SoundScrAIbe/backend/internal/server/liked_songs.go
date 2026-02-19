package server

import (
	"log"
	"net/http"
	"strconv"
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

// GetFavorites fetches the user's Spotify liked/saved tracks, albums, or followed artists with pagination.
func (h *handlers) GetFavorites(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	currentUser := u.(*user.User)

	entityType := c.Query("entity_type")
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 50 {
		limit = 20
	}
	offset := (page - 1) * limit

	ctx := c.Request.Context()

	type favoriteItem struct {
		EntityType string      `json:"entity_type"`
		EntityID   string      `json:"entity_id"`
		Name       string      `json:"name"`
		ImageURL   string      `json:"image_url"`
		Rating     *int        `json:"rating"`
		Shelf      *string     `json:"shelf"`
		Tags       []string    `json:"tags"`
		Extra      interface{} `json:"extra"`
	}

	var items []favoriteItem
	var total int

	switch entityType {
	case "album":
		resp, err := spotify.GetSavedAlbums(ctx, currentUser.AccessToken, limit, offset)
		if err != nil {
			log.Printf("failed to get saved albums for user %d: %v", currentUser.ID, err)
			c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch favorites"})
			return
		}
		total = resp.Total
		items = make([]favoriteItem, 0, len(resp.Items))
		for _, item := range resp.Items {
			imageURL := ""
			if len(item.Album.Images) > 0 {
				imageURL = item.Album.Images[0].URL
			}
			items = append(items, favoriteItem{
				EntityType: "album",
				EntityID:   item.Album.ID,
				Name:       item.Album.Name,
				ImageURL:   imageURL,
				Rating:     nil,
				Shelf:      nil,
				Tags:       []string{},
				Extra:      gin.H{},
			})
		}

	case "artist":
		resp, err := spotify.GetFollowedArtists(ctx, currentUser.AccessToken, limit, "")
		if err != nil {
			log.Printf("failed to get followed artists for user %d: %v", currentUser.ID, err)
			c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch favorites"})
			return
		}
		total = resp.Total
		items = make([]favoriteItem, 0, len(resp.Items))
		for _, item := range resp.Items {
			items = append(items, favoriteItem{
				EntityType: "artist",
				EntityID:   item.ID,
				Name:       item.Name,
				ImageURL:   item.ImageURL(),
				Rating:     nil,
				Shelf:      nil,
				Tags:       []string{},
				Extra:      gin.H{},
			})
		}

	case "track":
		resp, err := spotify.GetSavedTracks(ctx, currentUser.AccessToken, limit, offset)
		if err != nil {
			log.Printf("failed to get saved tracks for user %d: %v", currentUser.ID, err)
			c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch favorites"})
			return
		}
		total = resp.Total
		items = make([]favoriteItem, 0, len(resp.Items))
		for _, st := range resp.Items {
			imageURL := ""
			if len(st.Track.Album.Images) > 0 {
				imageURL = st.Track.Album.Images[0].URL
			}
			items = append(items, favoriteItem{
				EntityType: "track",
				EntityID:   st.Track.ID,
				Name:       st.Track.Name,
				ImageURL:   imageURL,
				Rating:     nil,
				Shelf:      nil,
				Tags:       []string{},
				Extra:      gin.H{},
			})
		}

	default:
		// "All" - combine tracks, albums, and artists
		items = make([]favoriteItem, 0)

		if resp, err := spotify.GetSavedTracks(ctx, currentUser.AccessToken, limit, offset); err == nil {
			total += resp.Total
			for _, st := range resp.Items {
				imageURL := ""
				if len(st.Track.Album.Images) > 0 {
					imageURL = st.Track.Album.Images[0].URL
				}
				items = append(items, favoriteItem{
					EntityType: "track",
					EntityID:   st.Track.ID,
					Name:       st.Track.Name,
					ImageURL:   imageURL,
					Rating:     nil,
					Shelf:      nil,
					Tags:       []string{},
					Extra:      gin.H{},
				})
			}
		}

		if resp, err := spotify.GetSavedAlbums(ctx, currentUser.AccessToken, limit, offset); err == nil {
			total += resp.Total
			for _, item := range resp.Items {
				imageURL := ""
				if len(item.Album.Images) > 0 {
					imageURL = item.Album.Images[0].URL
				}
				items = append(items, favoriteItem{
					EntityType: "album",
					EntityID:   item.Album.ID,
					Name:       item.Album.Name,
					ImageURL:   imageURL,
					Rating:     nil,
					Shelf:      nil,
					Tags:       []string{},
					Extra:      gin.H{},
				})
			}
		}

		if resp, err := spotify.GetFollowedArtists(ctx, currentUser.AccessToken, limit, ""); err == nil {
			total += resp.Total
			for _, item := range resp.Items {
				items = append(items, favoriteItem{
					EntityType: "artist",
					EntityID:   item.ID,
					Name:       item.Name,
					ImageURL:   item.ImageURL(),
					Rating:     nil,
					Shelf:      nil,
					Tags:       []string{},
					Extra:      gin.H{},
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
