package server

import (
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

	track, err := spotify.GetTrack(c.Request.Context(), currentUser.AccessToken, trackID)
	if err != nil {
		log.Printf("failed to fetch track %s for user %d: %v", trackID, currentUser.ID, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch track"})
		return
	}

	audioFeatures, err := spotify.GetAudioFeatures(c.Request.Context(), currentUser.AccessToken, trackID)
	if err != nil {
		log.Printf("failed to fetch audio features for track %s: %v", trackID, err)
		audioFeatures = nil
	}

	saved, _ := spotify.CheckSavedTracks(c.Request.Context(), currentUser.AccessToken, []string{trackID})
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
	err = h.db.QueryRowContext(c.Request.Context(),
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
