package server

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"soundscraibe/internal/spotify"
	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

func (h *handlers) ArtistDetail(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	currentUser := u.(*user.User)
	artistID := c.Param("id")

	ctx := c.Request.Context()

	artist, err := spotify.GetArtist(ctx, currentUser.AccessToken, artistID)
	if err != nil {
		log.Printf("failed to fetch artist %s for user %d: %v", artistID, currentUser.ID, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch artist"})
		return
	}

	// Query listening history stats
	var playCount int
	var firstPlayed, lastPlayed *time.Time
	err = h.db.QueryRowContext(ctx,
		`SELECT COUNT(*), MIN(played_at), MAX(played_at)
		 FROM listening_history
		 WHERE user_id = $1 AND artist_id = $2`,
		currentUser.ID, artistID,
	).Scan(&playCount, &firstPlayed, &lastPlayed)
	if err != nil {
		log.Printf("failed to query listening history for artist %s: %v", artistID, err)
		playCount = 0
	}

	// Query rating
	var ratingScore *int
	err = h.db.QueryRowContext(ctx,
		`SELECT score FROM ratings WHERE user_id = $1 AND entity_type = 'artist' AND entity_id = $2`,
		currentUser.ID, artistID,
	).Scan(&ratingScore)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("failed to query rating for artist %s: %v", artistID, err)
	}

	// Query shelf
	var shelfStatus *string
	err = h.db.QueryRowContext(ctx,
		`SELECT status FROM shelves WHERE user_id = $1 AND entity_type = 'artist' AND entity_id = $2`,
		currentUser.ID, artistID,
	).Scan(&shelfStatus)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("failed to query shelf for artist %s: %v", artistID, err)
	}

	// Query tags
	tagRows, err := h.db.QueryContext(ctx,
		`SELECT t.name FROM item_tags it JOIN tags t ON t.id = it.tag_id
		 WHERE it.user_id = $1 AND it.entity_type = 'artist' AND it.entity_id = $2`,
		currentUser.ID, artistID,
	)
	var artistTags []string
	if err == nil {
		defer tagRows.Close()
		for tagRows.Next() {
			var tagName string
			if err := tagRows.Scan(&tagName); err == nil {
				artistTags = append(artistTags, tagName)
			}
		}
	}
	if artistTags == nil {
		artistTags = []string{}
	}

	// Upsert entity_metadata
	artistImage := ""
	if len(artist.Images) > 0 {
		artistImage = artist.Images[0].URL
	}
	_, _ = h.db.ExecContext(ctx,
		`INSERT INTO entity_metadata (entity_type, entity_id, name, image_url)
		 VALUES ('artist', $1, $2, $3)
		 ON CONFLICT ON CONSTRAINT uq_entity_meta
		 DO UPDATE SET name = $2, image_url = $3, updated_at = now()`,
		artistID, artist.Name, artistImage,
	)

	// Build listening stats
	listeningStats := gin.H{"play_count": playCount}
	if firstPlayed != nil {
		listeningStats["first_played"] = firstPlayed.Format(time.RFC3339)
	}
	if lastPlayed != nil {
		listeningStats["last_played"] = lastPlayed.Format(time.RFC3339)
	}

	genres := artist.Genres
	if genres == nil {
		genres = []string{}
	}

	c.JSON(http.StatusOK, gin.H{
		"id":              artist.ID,
		"name":            artist.Name,
		"genres":          genres,
		"popularity":      artist.Popularity,
		"followers":       artist.Followers.Total,
		"images":          artist.Images,
		"spotify_url":     artist.ExternalURLs.Spotify,
		"listening_stats": listeningStats,
		"rating":          ratingScore,
		"shelf":           shelfStatus,
		"tags":            artistTags,
	})
}
