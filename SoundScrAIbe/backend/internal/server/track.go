package server

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"time"

	"soundscraibe/internal/spotify"
	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

func (h *handlers) TrackDetail(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	currentUser := u.(*user.User)
	trackID := c.Param("id")
	ctx := c.Request.Context()

	track, err := spotify.GetTrack(ctx, currentUser.AccessToken, trackID)
	if err != nil {
		log.Printf("failed to fetch track %s for user %d: %v", trackID, currentUser.ID, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch track"})
		return
	}

	audioFeatures, err := spotify.GetAudioFeatures(ctx, currentUser.AccessToken, trackID)
	if err != nil {
		log.Printf("failed to fetch audio features for track %s: %v", trackID, err)
		audioFeatures = nil
	}

	saved, _ := spotify.CheckSavedTracks(ctx, currentUser.AccessToken, []string{trackID})
	isLiked := len(saved) > 0 && saved[0]

	type artistItem struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	artists := make([]artistItem, len(track.Artists))
	for i, a := range track.Artists {
		artists[i] = artistItem{ID: a.ID, Name: a.Name}
	}

	albumCover := ""
	if len(track.Album.Images) > 0 {
		albumCover = track.Album.Images[0].URL
	}

	response := gin.H{
		"id":           track.ID,
		"name":         track.Name,
		"duration_ms":  track.DurationMs,
		"explicit":     track.Explicit,
		"track_number": track.TrackNumber,
		"disc_number":  track.DiscNumber,
		"preview_url":  track.PreviewURL,
		"artists":      artists,
		"album_name":   track.Album.Name,
		"album_id":     track.Album.ID,
		"album_cover":  albumCover,
		"release_date": track.Album.ReleaseDate,
		"total_tracks": track.Album.TotalTracks,
		"spotify_url":  track.ExternalURLs.Spotify,
		"is_liked":     isLiked,
	}

	// Query listening history stats from local DB
	var playCount int
	var firstPlayed, lastPlayed *time.Time
	err = h.db.QueryRowContext(ctx,
		`SELECT COUNT(*), MIN(played_at), MAX(played_at)
		 FROM listening_history
		 WHERE user_id = $1 AND track_id = $2`,
		currentUser.ID, trackID,
	).Scan(&playCount, &firstPlayed, &lastPlayed)
	if err != nil {
		log.Printf("failed to query listening history for track %s: %v", trackID, err)
		playCount = 0
	}

	stats := gin.H{"play_count": playCount}
	if firstPlayed != nil {
		stats["first_played"] = firstPlayed.Format(time.RFC3339)
	}
	if lastPlayed != nil {
		stats["last_played"] = lastPlayed.Format(time.RFC3339)
	}
	response["listening_stats"] = stats

	// Query rating
	var ratingScore *int
	err = h.db.QueryRowContext(ctx,
		`SELECT score FROM ratings WHERE user_id = $1 AND entity_type = 'track' AND entity_id = $2`,
		currentUser.ID, trackID,
	).Scan(&ratingScore)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("failed to query rating for track %s: %v", trackID, err)
	}

	// Query shelf
	var shelfStatus *string
	err = h.db.QueryRowContext(ctx,
		`SELECT status FROM shelves WHERE user_id = $1 AND entity_type = 'track' AND entity_id = $2`,
		currentUser.ID, trackID,
	).Scan(&shelfStatus)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("failed to query shelf for track %s: %v", trackID, err)
	}

	// Query tags
	tagRows, err := h.db.QueryContext(ctx,
		`SELECT t.name FROM item_tags it JOIN tags t ON t.id = it.tag_id
		 WHERE it.user_id = $1 AND it.entity_type = 'track' AND it.entity_id = $2`,
		currentUser.ID, trackID,
	)
	var trackTags []string
	if err == nil {
		defer tagRows.Close()
		for tagRows.Next() {
			var tagName string
			if err := tagRows.Scan(&tagName); err == nil {
				trackTags = append(trackTags, tagName)
			}
		}
	}
	if trackTags == nil {
		trackTags = []string{}
	}

	response["rating"] = ratingScore
	response["shelf"] = shelfStatus
	response["tags"] = trackTags

	// Upsert entity metadata for library
	_, _ = h.db.ExecContext(ctx,
		`INSERT INTO entity_metadata (entity_type, entity_id, name, image_url, extra_json)
		 VALUES ('track', $1, $2, $3, $4)
		 ON CONFLICT ON CONSTRAINT uq_entity_meta
		 DO UPDATE SET name = $2, image_url = $3, extra_json = $4, updated_at = now()`,
		trackID, track.Name, albumCover,
		fmt.Sprintf(`{"artist_name": %q}`, track.Artists[0].Name),
	)

	if audioFeatures != nil {
		response["audio_features"] = gin.H{
			"danceability":     audioFeatures.Danceability,
			"energy":           audioFeatures.Energy,
			"acousticness":     audioFeatures.Acousticness,
			"instrumentalness": audioFeatures.Instrumentalness,
			"liveness":         audioFeatures.Liveness,
			"speechiness":      audioFeatures.Speechiness,
			"valence":          audioFeatures.Valence,
			"tempo":            audioFeatures.Tempo,
			"key":              audioFeatures.Key,
			"mode":             audioFeatures.Mode,
			"loudness":         audioFeatures.Loudness,
			"time_signature":   audioFeatures.TimeSignature,
		}
	}

	c.JSON(http.StatusOK, response)
}
