package server

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"sync"
	"time"

	"soundscraibe/internal/spotify"
	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

// artistChartEntry represents a single artist in the chart response.
type artistChartEntry struct {
	ArtistID       string `json:"artist_id"`
	ArtistName     string `json:"artist_name"`
	ArtistImageURL string `json:"artist_image_url"`
	PlayCount      int    `json:"play_count"`
	ListeningTimeMs int64 `json:"listening_time_ms"`
	SpotifyRank    int    `json:"spotify_rank,omitempty"`
}

// ArtistCharts returns aggregated artist listening stats merged with Spotify top-artist data.
func (h *handlers) ArtistCharts(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	currentUser := u.(*user.User)

	timeRange := c.DefaultQuery("time_range", "medium_term")
	switch timeRange {
	case "short_term", "medium_term", "long_term":
		// valid
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "time_range must be short_term, medium_term, or long_term"})
		return
	}

	ctx := c.Request.Context()

	// Step 1: Sync recently played into listening_history (non-fatal).
	syncListeningHistory(ctx, h.db, currentUser)

	// Step 2: Concurrently fetch DB aggregation and Spotify top artists.
	var (
		wg         sync.WaitGroup
		dbEntries  []artistChartEntry
		dbErr      error
		topArtists *spotify.TopArtistsResponse
		topErr     error
	)

	wg.Add(2)

	go func() {
		defer wg.Done()
		dbEntries, dbErr = aggregateArtistStats(ctx, h.db, currentUser.ID)
	}()

	go func() {
		defer wg.Done()
		topArtists, topErr = spotify.GetTopArtists(ctx, currentUser.AccessToken, timeRange, 50)
	}()

	wg.Wait()

	if dbErr != nil {
		log.Printf("failed to aggregate artist stats for user %d: %v", currentUser.ID, dbErr)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load artist chart data"})
		return
	}

	// Top-artists is non-fatal: if it fails, we just skip images/rank.
	if topErr != nil {
		log.Printf("failed to fetch top artists for user %d (non-fatal): %v", currentUser.ID, topErr)
	}

	// Step 3: Merge top-artist data (image, rank) into DB entries.
	if topArtists != nil {
		artistRank := make(map[string]int, len(topArtists.Items))
		artistImage := make(map[string]string, len(topArtists.Items))
		for i, a := range topArtists.Items {
			artistRank[a.ID] = i + 1
			artistImage[a.ID] = a.ImageURL()
		}
		for i := range dbEntries {
			if rank, ok := artistRank[dbEntries[i].ArtistID]; ok {
				dbEntries[i].SpotifyRank = rank
			}
			if img, ok := artistImage[dbEntries[i].ArtistID]; ok {
				dbEntries[i].ArtistImageURL = img
			}
		}
	}

	// Step 4: Fetch images for artists still missing them (up to 10 individual lookups).
	fetched := 0
	for i := range dbEntries {
		if dbEntries[i].ArtistImageURL != "" || fetched >= 10 {
			continue
		}
		artist, err := spotify.GetArtist(ctx, currentUser.AccessToken, dbEntries[i].ArtistID)
		if err != nil {
			log.Printf("failed to fetch artist %s (non-fatal): %v", dbEntries[i].ArtistID, err)
			continue
		}
		dbEntries[i].ArtistImageURL = artist.ImageURL()
		fetched++
	}

	c.JSON(http.StatusOK, gin.H{
		"time_range": timeRange,
		"synced_at":  time.Now().UTC().Format(time.RFC3339),
		"artists":    dbEntries,
	})
}

// syncListeningHistory fetches recently played tracks and upserts them into the
// listening_history table. Errors are logged but do not fail the request.
func syncListeningHistory(ctx context.Context, db *sql.DB, currentUser *user.User) {
	result, err := spotify.GetRecentlyPlayed(ctx, currentUser.AccessToken)
	if err != nil {
		log.Printf("failed to fetch recently played for sync (user %d): %v", currentUser.ID, err)
		return
	}

	for _, item := range result.Items {
		playedAt, err := time.Parse(time.RFC3339, item.PlayedAt)
		if err != nil {
			log.Printf("skipping item with unparseable played_at %q: %v", item.PlayedAt, err)
			continue
		}

		for _, artist := range item.Track.Artists {
			_, err := db.ExecContext(ctx,
				`INSERT INTO listening_history (user_id, track_id, track_name, artist_id, artist_name, album_id, album_name, duration_ms, played_at)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
				 ON CONFLICT (user_id, track_id, artist_id, played_at) DO UPDATE SET album_id = EXCLUDED.album_id, album_name = EXCLUDED.album_name`,
				currentUser.ID,
				item.Track.ID,
				item.Track.Name,
				artist.ID,
				artist.Name,
				item.Track.Album.ID,
				item.Track.Album.Name,
				item.Track.DurationMs,
				playedAt,
			)
			if err != nil {
				log.Printf("failed to upsert listening_history row for user %d, track %s: %v",
					currentUser.ID, item.Track.ID, err)
			}
		}
	}
}

// aggregateArtistStats queries the listening_history table for per-artist play counts
// and total listening time, ordered by play count descending.
func aggregateArtistStats(ctx context.Context, db *sql.DB, userID int64) ([]artistChartEntry, error) {
	rows, err := db.QueryContext(ctx,
		`SELECT artist_id, MAX(artist_name) AS artist_name, COUNT(*) AS play_count, SUM(duration_ms) AS listening_time_ms
		 FROM listening_history
		 WHERE user_id = $1
		 GROUP BY artist_id
		 ORDER BY play_count DESC
		 LIMIT 50`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []artistChartEntry
	for rows.Next() {
		var e artistChartEntry
		if err := rows.Scan(&e.ArtistID, &e.ArtistName, &e.PlayCount, &e.ListeningTimeMs); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if entries == nil {
		entries = []artistChartEntry{}
	}

	return entries, nil
}
