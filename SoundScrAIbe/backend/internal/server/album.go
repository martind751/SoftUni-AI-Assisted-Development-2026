package server

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"soundscraibe/internal/spotify"
	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

func (h *handlers) AlbumDetail(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	currentUser := u.(*user.User)
	albumID := c.Param("id")

	ctx := c.Request.Context()

	album, err := spotify.GetAlbum(ctx, currentUser.AccessToken, albumID)
	if err != nil {
		log.Printf("failed to fetch album %s for user %d: %v", albumID, currentUser.ID, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch album"})
		return
	}

	// Query rating
	var ratingScore *int
	err = h.db.QueryRowContext(ctx,
		`SELECT score FROM ratings WHERE user_id = $1 AND entity_type = 'album' AND entity_id = $2`,
		currentUser.ID, albumID,
	).Scan(&ratingScore)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("failed to query rating for album %s: %v", albumID, err)
	}

	// Query shelf
	var shelfStatus *string
	err = h.db.QueryRowContext(ctx,
		`SELECT status FROM shelves WHERE user_id = $1 AND entity_type = 'album' AND entity_id = $2`,
		currentUser.ID, albumID,
	).Scan(&shelfStatus)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("failed to query shelf for album %s: %v", albumID, err)
	}

	// Query tags
	tagRows, err := h.db.QueryContext(ctx,
		`SELECT t.name FROM item_tags it JOIN tags t ON t.id = it.tag_id
		 WHERE it.user_id = $1 AND it.entity_type = 'album' AND it.entity_id = $2`,
		currentUser.ID, albumID,
	)
	var albumTags []string
	if err == nil {
		defer tagRows.Close()
		for tagRows.Next() {
			var tagName string
			if err := tagRows.Scan(&tagName); err == nil {
				albumTags = append(albumTags, tagName)
			}
		}
	}
	if albumTags == nil {
		albumTags = []string{}
	}

	// Build artists list
	type artistItem struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	artists := make([]artistItem, len(album.Artists))
	for i, a := range album.Artists {
		artists[i] = artistItem{ID: a.ID, Name: a.Name}
	}

	// Upsert entity_metadata
	albumCover := ""
	if len(album.Images) > 0 {
		albumCover = album.Images[0].URL
	}
	artistName := ""
	if len(album.Artists) > 0 {
		artistName = album.Artists[0].Name
	}
	_, _ = h.db.ExecContext(ctx,
		`INSERT INTO entity_metadata (entity_type, entity_id, name, image_url, extra_json)
		 VALUES ('album', $1, $2, $3, $4)
		 ON CONFLICT ON CONSTRAINT uq_entity_meta
		 DO UPDATE SET name = $2, image_url = $3, extra_json = $4, updated_at = now()`,
		albumID, album.Name, albumCover,
		fmt.Sprintf(`{"artist_name": %q}`, artistName),
	)

	genres := album.Genres
	if genres == nil {
		genres = []string{}
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           album.ID,
		"name":         album.Name,
		"album_type":   album.AlbumType,
		"release_date": album.ReleaseDate,
		"total_tracks": album.TotalTracks,
		"label":        album.Label,
		"popularity":   album.Popularity,
		"genres":       genres,
		"artists":      artists,
		"images":       album.Images,
		"spotify_url":  album.ExternalURLs.Spotify,
		"rating":       ratingScore,
		"shelf":        shelfStatus,
		"tags":         albumTags,
	})
}
