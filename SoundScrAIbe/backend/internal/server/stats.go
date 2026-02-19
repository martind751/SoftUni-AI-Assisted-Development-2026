package server

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"soundscraibe/internal/spotify"
	"soundscraibe/internal/user"

	"github.com/gin-gonic/gin"
)

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

type statValue struct {
	Value     interface{} `json:"value"`
	ChangePct *float64    `json:"change_pct"`
}

type statsOverviewResponse struct {
	Period string              `json:"period"`
	Stats  map[string]statValue `json:"stats"`
}

type topItem struct {
	Rank        int     `json:"rank"`
	ID          string  `json:"id,omitempty"`
	Name        string  `json:"name"`
	Subtitle    string  `json:"subtitle,omitempty"`
	ImageURL    string  `json:"image_url,omitempty"`
	PlayCount   int     `json:"play_count"`
	TotalMs     int64   `json:"total_ms"`
	SpotifyRank *int    `json:"spotify_rank,omitempty"`
}

type statsTopResponse struct {
	Type      string    `json:"type"`
	TimeRange string    `json:"time_range"`
	Items     []topItem `json:"items"`
}

type clockHour struct {
	Hour    int     `json:"hour"`
	Streams int     `json:"streams"`
	Minutes float64 `json:"minutes"`
}

type statsClockResponse struct {
	Hours []clockHour `json:"hours"`
}

// ---------------------------------------------------------------------------
// Handler 1: StatsOverview
// ---------------------------------------------------------------------------

func (h *handlers) StatsOverview(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	currentUser := u.(*user.User)

	period := c.DefaultQuery("period", "week")
	switch period {
	case "day", "week", "month", "year", "lifetime":
		// valid
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "period must be day, week, month, year, or lifetime"})
		return
	}

	ctx := c.Request.Context()
	syncListeningHistory(ctx, h.db, currentUser)

	now := time.Now().UTC()
	var currentStart, currentEnd, prevStart, prevEnd time.Time

	switch period {
	case "day":
		currentStart = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
		currentEnd = now
		prevStart = currentStart.AddDate(0, 0, -1)
		// Previous window ends at yesterday's same time-of-day.
		prevEnd = prevStart.Add(now.Sub(currentStart))
	case "week":
		currentStart = now.AddDate(0, 0, -7)
		currentEnd = now
		prevStart = now.AddDate(0, 0, -14)
		prevEnd = currentStart
	case "month":
		currentStart = now.AddDate(0, 0, -30)
		currentEnd = now
		prevStart = now.AddDate(0, 0, -60)
		prevEnd = currentStart
	case "year":
		currentStart = now.AddDate(0, 0, -365)
		currentEnd = now
		prevStart = now.AddDate(0, 0, -730)
		prevEnd = currentStart
	case "lifetime":
		currentStart = time.Date(1970, 1, 1, 0, 0, 0, 0, time.UTC)
		currentEnd = now
		prevStart = time.Date(1970, 1, 1, 0, 0, 0, 0, time.UTC)
		prevEnd = prevStart // zero-width window
	}

	query := `
WITH plays AS (
    SELECT DISTINCT ON (track_id, played_at)
        track_id, artist_id, album_id, duration_ms
    FROM listening_history
    WHERE user_id = $1 AND played_at >= $2 AND played_at < $3
),
current_stats AS (
    SELECT
        COUNT(*) AS streams,
        COALESCE(SUM(duration_ms), 0) AS total_ms,
        COUNT(DISTINCT track_id) AS distinct_tracks,
        COUNT(DISTINCT artist_id) AS distinct_artists,
        COUNT(DISTINCT album_id) FILTER (WHERE album_id != '') AS distinct_albums
    FROM plays
),
prev_plays AS (
    SELECT DISTINCT ON (track_id, played_at)
        track_id, artist_id, album_id, duration_ms
    FROM listening_history
    WHERE user_id = $1 AND played_at >= $4 AND played_at < $5
),
prev_stats AS (
    SELECT
        COUNT(*) AS streams,
        COALESCE(SUM(duration_ms), 0) AS total_ms,
        COUNT(DISTINCT track_id) AS distinct_tracks,
        COUNT(DISTINCT artist_id) AS distinct_artists,
        COUNT(DISTINCT album_id) FILTER (WHERE album_id != '') AS distinct_albums
    FROM prev_plays
)
SELECT
    c.streams, c.total_ms, c.distinct_tracks, c.distinct_artists, c.distinct_albums,
    p.streams, p.total_ms, p.distinct_tracks, p.distinct_artists, p.distinct_albums
FROM current_stats c, prev_stats p`

	var cStreams, cTotalMs, cTracks, cArtists, cAlbums int64
	var pStreams, pTotalMs, pTracks, pArtists, pAlbums int64

	err := h.db.QueryRowContext(ctx, query,
		currentUser.ID, currentStart, currentEnd, prevStart, prevEnd,
	).Scan(
		&cStreams, &cTotalMs, &cTracks, &cArtists, &cAlbums,
		&pStreams, &pTotalMs, &pTracks, &pArtists, &pAlbums,
	)
	if err != nil {
		log.Printf("stats overview query failed for user %d: %v", currentUser.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load stats"})
		return
	}

	changePct := func(current, previous int64) *float64 {
		if period == "lifetime" || previous == 0 {
			return nil
		}
		v := (float64(current-previous) / float64(previous)) * 100
		v = math.Round(v*10) / 10
		return &v
	}

	// Minutes from ms; hours from minutes.
	cMinutes := float64(cTotalMs) / 60000.0
	pMinutes := float64(pTotalMs) / 60000.0
	cHours := math.Round(cMinutes/60.0*10) / 10
	// change_pct for minutes/hours are based on total_ms.
	minutesChange := changePct(cTotalMs, pTotalMs)

	_ = pMinutes // used only via changePct on raw ms

	resp := statsOverviewResponse{
		Period: period,
		Stats: map[string]statValue{
			"streams":           {Value: cStreams, ChangePct: changePct(cStreams, pStreams)},
			"minutes":           {Value: int64(cMinutes), ChangePct: minutesChange},
			"hours":             {Value: cHours, ChangePct: minutesChange},
			"different_tracks":  {Value: cTracks, ChangePct: changePct(cTracks, pTracks)},
			"different_artists": {Value: cArtists, ChangePct: changePct(cArtists, pArtists)},
			"different_albums":  {Value: cAlbums, ChangePct: changePct(cAlbums, pAlbums)},
		},
	}

	c.JSON(http.StatusOK, resp)
}

// ---------------------------------------------------------------------------
// Handler 2: SpotifyTop — pure Spotify API rankings (tracks & artists only)
// ---------------------------------------------------------------------------

func (h *handlers) SpotifyTop(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	currentUser := u.(*user.User)

	typ := c.DefaultQuery("type", "tracks")
	switch typ {
	case "tracks", "artists":
		// valid
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "type must be tracks or artists"})
		return
	}

	timeRange := c.DefaultQuery("time_range", "medium_term")
	switch timeRange {
	case "short_term", "medium_term", "long_term":
		// valid
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "time_range must be short_term, medium_term, or long_term"})
		return
	}

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	ctx := c.Request.Context()
	syncListeningHistory(ctx, h.db, currentUser)

	var items []topItem

	switch typ {
	case "tracks":
		topTracks, err := spotify.GetTopTracks(ctx, currentUser.AccessToken, timeRange, limit)
		if err != nil {
			log.Printf("spotify top tracks failed for user %d: %v", currentUser.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load spotify top tracks"})
			return
		}
		items = make([]topItem, 0, len(topTracks.Items))
		for i, t := range topTracks.Items {
			item := topItem{
				Rank:     i + 1,
				ID:       t.ID,
				Name:     t.Name,
				Subtitle: joinArtistNames(t.Artists),
			}
			if len(t.Album.Images) > 0 {
				item.ImageURL = t.Album.Images[0].URL
			}
			items = append(items, item)
		}

	case "artists":
		topArtists, err := spotify.GetTopArtists(ctx, currentUser.AccessToken, timeRange, limit)
		if err != nil {
			log.Printf("spotify top artists failed for user %d: %v", currentUser.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load spotify top artists"})
			return
		}
		items = make([]topItem, 0, len(topArtists.Items))
		for i, a := range topArtists.Items {
			items = append(items, topItem{
				Rank:     i + 1,
				ID:       a.ID,
				Name:     a.Name,
				ImageURL: a.ImageURL(),
			})
		}
	}

	if items == nil {
		items = []topItem{}
	}

	c.JSON(http.StatusOK, statsTopResponse{
		Type:      typ,
		TimeRange: timeRange,
		Items:     items,
	})
}

// ---------------------------------------------------------------------------
// Handler 3: MyTop — pure DB rankings by play_count
// ---------------------------------------------------------------------------

func (h *handlers) MyTop(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	currentUser := u.(*user.User)

	typ := c.DefaultQuery("type", "tracks")
	switch typ {
	case "tracks", "artists", "albums", "genres":
		// valid
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "type must be tracks, artists, albums, or genres"})
		return
	}

	timeRange := c.DefaultQuery("time_range", "medium_term")
	switch timeRange {
	case "short_term", "medium_term", "long_term":
		// valid
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "time_range must be short_term, medium_term, or long_term"})
		return
	}

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	ctx := c.Request.Context()
	syncListeningHistory(ctx, h.db, currentUser)

	dateCutoff := timeRangeToCutoff(timeRange)

	var items []topItem
	var err error

	switch typ {
	case "tracks":
		items, err = h.myTopTracks(ctx, currentUser, timeRange, dateCutoff, limit)
	case "artists":
		items, err = h.myTopArtists(ctx, currentUser, timeRange, dateCutoff, limit)
	case "albums":
		items, err = h.statsTopAlbums(c, currentUser, dateCutoff, limit)
	case "genres":
		items, err = h.myTopGenres(ctx, currentUser, timeRange, dateCutoff, limit)
	}

	if err != nil {
		log.Printf("my top %s failed for user %d: %v", typ, currentUser.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to load top %s", typ)})
		return
	}

	c.JSON(http.StatusOK, statsTopResponse{
		Type:      typ,
		TimeRange: timeRange,
		Items:     items,
	})
}

func timeRangeToCutoff(timeRange string) time.Time {
	now := time.Now().UTC()
	switch timeRange {
	case "short_term":
		return now.AddDate(0, 0, -28)
	case "medium_term":
		return now.AddDate(0, 0, -180)
	default: // long_term
		return time.Date(1970, 1, 1, 0, 0, 0, 0, time.UTC)
	}
}

// --- tracks ---

type dbTrackRow struct {
	TrackID    string
	TrackName  string
	ArtistName string
	AlbumID    string
	AlbumName  string
	PlayCount  int
	TotalMs    int64
}

func (h *handlers) myTopTracks(ctx context.Context, currentUser *user.User, timeRange string, dateCutoff time.Time, limit int) ([]topItem, error) {
	dbRows, err := queryTopTracks(ctx, h.db, currentUser.ID, dateCutoff, limit)
	if err != nil {
		return nil, fmt.Errorf("querying top tracks: %w", err)
	}

	// Collect track IDs to look up images from entity_metadata.
	trackIDs := make([]string, len(dbRows))
	for i, r := range dbRows {
		trackIDs[i] = r.TrackID
	}

	// Batch-fetch images from entity_metadata.
	imageMap := h.fetchEntityImages(ctx, "track", trackIDs)

	items := make([]topItem, 0, len(dbRows))
	for i, r := range dbRows {
		item := topItem{
			Rank:      i + 1,
			ID:        r.TrackID,
			Name:      r.TrackName,
			Subtitle:  r.ArtistName,
			PlayCount: r.PlayCount,
			TotalMs:   r.TotalMs,
		}
		if url, ok := imageMap[r.TrackID]; ok {
			item.ImageURL = url
		}
		items = append(items, item)
	}

	if items == nil {
		items = []topItem{}
	}

	return items, nil
}

func queryTopTracks(ctx context.Context, db *sql.DB, userID int64, cutoff time.Time, limit int) ([]dbTrackRow, error) {
	rows, err := db.QueryContext(ctx,
		`WITH plays AS (
			SELECT DISTINCT ON (track_id, played_at)
				track_id, track_name, artist_name, album_id, album_name, duration_ms
			FROM listening_history
			WHERE user_id = $1 AND played_at >= $2
		)
		SELECT track_id, MAX(track_name) AS track_name,
			   MAX(artist_name) AS artist_name,
			   MAX(album_id) AS album_id, MAX(album_name) AS album_name,
			   COUNT(*) AS play_count, SUM(duration_ms) AS total_ms
		FROM plays
		GROUP BY track_id
		ORDER BY play_count DESC
		LIMIT $3`,
		userID, cutoff, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []dbTrackRow
	for rows.Next() {
		var r dbTrackRow
		if err := rows.Scan(&r.TrackID, &r.TrackName, &r.ArtistName, &r.AlbumID, &r.AlbumName, &r.PlayCount, &r.TotalMs); err != nil {
			return nil, err
		}
		result = append(result, r)
	}
	return result, rows.Err()
}

// --- artists ---

type dbArtistRow struct {
	ArtistID   string
	ArtistName string
	PlayCount  int
	TotalMs    int64
}

func (h *handlers) myTopArtists(ctx context.Context, currentUser *user.User, timeRange string, dateCutoff time.Time, limit int) ([]topItem, error) {
	dbRows, err := queryTopArtists(ctx, h.db, currentUser.ID, dateCutoff, limit)
	if err != nil {
		return nil, fmt.Errorf("querying top artists: %w", err)
	}

	// Collect artist IDs to look up images from entity_metadata.
	artistIDs := make([]string, len(dbRows))
	for i, r := range dbRows {
		artistIDs[i] = r.ArtistID
	}

	imageMap := h.fetchEntityImages(ctx, "artist", artistIDs)

	// For artists missing images, do individual Spotify lookups (up to 10).
	fetched := 0
	for _, r := range dbRows {
		if _, ok := imageMap[r.ArtistID]; ok {
			continue
		}
		if fetched >= 10 {
			break
		}
		artist, apiErr := spotify.GetArtist(ctx, currentUser.AccessToken, r.ArtistID)
		if apiErr != nil {
			log.Printf("failed to fetch artist %s (non-fatal): %v", r.ArtistID, apiErr)
			continue
		}
		if url := artist.ImageURL(); url != "" {
			imageMap[r.ArtistID] = url
			fetched++
		}
	}

	items := make([]topItem, 0, len(dbRows))
	for i, r := range dbRows {
		item := topItem{
			Rank:      i + 1,
			ID:        r.ArtistID,
			Name:      r.ArtistName,
			PlayCount: r.PlayCount,
			TotalMs:   r.TotalMs,
		}
		if url, ok := imageMap[r.ArtistID]; ok {
			item.ImageURL = url
		}
		items = append(items, item)
	}

	if items == nil {
		items = []topItem{}
	}

	return items, nil
}

func queryTopArtists(ctx context.Context, db *sql.DB, userID int64, cutoff time.Time, limit int) ([]dbArtistRow, error) {
	rows, err := db.QueryContext(ctx,
		`SELECT artist_id, MAX(artist_name) AS artist_name,
				COUNT(*) AS play_count, SUM(duration_ms) AS total_ms
		 FROM listening_history
		 WHERE user_id = $1 AND played_at >= $2
		 GROUP BY artist_id
		 ORDER BY play_count DESC
		 LIMIT $3`,
		userID, cutoff, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []dbArtistRow
	for rows.Next() {
		var r dbArtistRow
		if err := rows.Scan(&r.ArtistID, &r.ArtistName, &r.PlayCount, &r.TotalMs); err != nil {
			return nil, err
		}
		result = append(result, r)
	}
	return result, rows.Err()
}

// --- albums ---

type dbAlbumRow struct {
	AlbumID   string
	AlbumName string
	PlayCount int
	TotalMs   int64
}

func (h *handlers) statsTopAlbums(c *gin.Context, currentUser *user.User, dateCutoff time.Time, limit int) ([]topItem, error) {
	ctx := c.Request.Context()

	rows, err := h.db.QueryContext(ctx,
		`WITH plays AS (
			SELECT DISTINCT ON (track_id, played_at)
				album_id, album_name, duration_ms
			FROM listening_history
			WHERE user_id = $1 AND played_at >= $2 AND album_id != ''
		)
		SELECT album_id, MAX(album_name) AS album_name,
			   COUNT(*) AS play_count, SUM(duration_ms) AS total_ms
		FROM plays
		GROUP BY album_id
		ORDER BY play_count DESC
		LIMIT $3`,
		currentUser.ID, dateCutoff, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("querying top albums: %w", err)
	}
	defer rows.Close()

	var dbRows []dbAlbumRow
	for rows.Next() {
		var r dbAlbumRow
		if err := rows.Scan(&r.AlbumID, &r.AlbumName, &r.PlayCount, &r.TotalMs); err != nil {
			return nil, err
		}
		dbRows = append(dbRows, r)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Build items with image lookups.
	fetched := 0
	items := make([]topItem, 0, len(dbRows))
	for i, r := range dbRows {
		item := topItem{
			Rank:      i + 1,
			ID:        r.AlbumID,
			Name:      r.AlbumName,
			PlayCount: r.PlayCount,
			TotalMs:   r.TotalMs,
		}

		// Try entity_metadata first.
		var imgURL sql.NullString
		_ = h.db.QueryRowContext(ctx,
			`SELECT image_url FROM entity_metadata WHERE entity_type = 'album' AND entity_id = $1`,
			r.AlbumID,
		).Scan(&imgURL)
		if imgURL.Valid && imgURL.String != "" {
			item.ImageURL = imgURL.String
		} else if fetched < 10 {
			// Fallback: Spotify API lookup.
			album, apiErr := spotify.GetAlbum(ctx, currentUser.AccessToken, r.AlbumID)
			if apiErr != nil {
				log.Printf("failed to fetch album %s (non-fatal): %v", r.AlbumID, apiErr)
			} else if len(album.Images) > 0 {
				item.ImageURL = album.Images[0].URL
				fetched++
			}
		}

		items = append(items, item)
	}

	if items == nil {
		items = []topItem{}
	}

	return items, nil
}

// --- genres ---

func (h *handlers) myTopGenres(ctx context.Context, currentUser *user.User, timeRange string, dateCutoff time.Time, limit int) ([]topItem, error) {
	var (
		wg         sync.WaitGroup
		dbRows     []dbArtistRow
		dbErr      error
		topArtists *spotify.TopArtistsResponse
		topErr     error
	)

	// We need Spotify's GetTopArtists solely to map artist IDs -> genre lists.
	// Ranking is still by DB play_count.
	wg.Add(2)
	go func() {
		defer wg.Done()
		dbRows, dbErr = queryTopArtists(ctx, h.db, currentUser.ID, dateCutoff, 200)
	}()
	go func() {
		defer wg.Done()
		topArtists, topErr = spotify.GetTopArtists(ctx, currentUser.AccessToken, timeRange, 50)
	}()
	wg.Wait()

	if dbErr != nil {
		return nil, fmt.Errorf("querying artist stats for genres: %w", dbErr)
	}
	if topErr != nil {
		log.Printf("failed to fetch spotify top artists for genres (non-fatal): %v", topErr)
	}

	// Build artist -> genres map from Spotify data.
	artistGenres := make(map[string][]string)
	if topArtists != nil {
		for _, a := range topArtists.Items {
			if len(a.Genres) > 0 {
				artistGenres[a.ID] = a.Genres
			}
		}
	}

	// Aggregate genres: distribute each artist's play_count equally across their genres.
	type genreAgg struct {
		PlayCount   float64
		TotalMs     float64
		ArtistCount int
		Artists     map[string]bool
	}
	genreMap := make(map[string]*genreAgg)

	for _, r := range dbRows {
		genres, ok := artistGenres[r.ArtistID]
		if !ok || len(genres) == 0 {
			continue
		}
		share := 1.0 / float64(len(genres))
		for _, g := range genres {
			agg, exists := genreMap[g]
			if !exists {
				agg = &genreAgg{Artists: make(map[string]bool)}
				genreMap[g] = agg
			}
			agg.PlayCount += float64(r.PlayCount) * share
			agg.TotalMs += float64(r.TotalMs) * share
			if !agg.Artists[r.ArtistID] {
				agg.Artists[r.ArtistID] = true
				agg.ArtistCount++
			}
		}
	}

	// Convert to slice and sort by play_count DESC.
	type genreEntry struct {
		Name        string
		PlayCount   int
		TotalMs     int64
		ArtistCount int
	}
	entries := make([]genreEntry, 0, len(genreMap))
	for name, agg := range genreMap {
		entries = append(entries, genreEntry{
			Name:        name,
			PlayCount:   int(math.Round(agg.PlayCount)),
			TotalMs:     int64(math.Round(agg.TotalMs)),
			ArtistCount: agg.ArtistCount,
		})
	}
	// Sort descending by PlayCount.
	for i := 0; i < len(entries); i++ {
		for j := i + 1; j < len(entries); j++ {
			if entries[j].PlayCount > entries[i].PlayCount {
				entries[i], entries[j] = entries[j], entries[i]
			}
		}
	}
	if len(entries) > limit {
		entries = entries[:limit]
	}

	items := make([]topItem, len(entries))
	for i, e := range entries {
		subtitle := fmt.Sprintf("%d artists", e.ArtistCount)
		if e.ArtistCount == 1 {
			subtitle = "1 artist"
		}
		items[i] = topItem{
			Rank:      i + 1,
			Name:      e.Name,
			Subtitle:  subtitle,
			PlayCount: e.PlayCount,
			TotalMs:   e.TotalMs,
		}
	}

	return items, nil
}

// ---------------------------------------------------------------------------
// Handler 4: StatsClock
// ---------------------------------------------------------------------------

func (h *handlers) StatsClock(c *gin.Context) {
	u, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	currentUser := u.(*user.User)

	ctx := c.Request.Context()
	syncListeningHistory(ctx, h.db, currentUser)

	rows, err := h.db.QueryContext(ctx,
		`WITH plays AS (
			SELECT DISTINCT ON (track_id, played_at)
				duration_ms, played_at
			FROM listening_history
			WHERE user_id = $1
		)
		SELECT
			EXTRACT(HOUR FROM played_at) AS hour,
			COUNT(*) AS stream_count,
			COALESCE(SUM(duration_ms), 0) AS total_ms
		FROM plays
		GROUP BY EXTRACT(HOUR FROM played_at)
		ORDER BY hour`,
		currentUser.ID,
	)
	if err != nil {
		log.Printf("stats clock query failed for user %d: %v", currentUser.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load listening clock"})
		return
	}
	defer rows.Close()

	hourMap := make(map[int]clockHour)
	for rows.Next() {
		var hour float64
		var streams int
		var totalMs int64
		if err := rows.Scan(&hour, &streams, &totalMs); err != nil {
			log.Printf("stats clock row scan failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load listening clock"})
			return
		}
		h := int(hour)
		hourMap[h] = clockHour{
			Hour:    h,
			Streams: streams,
			Minutes: math.Round(float64(totalMs)/60000.0*10) / 10,
		}
	}
	if err := rows.Err(); err != nil {
		log.Printf("stats clock rows error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load listening clock"})
		return
	}

	// Fill all 24 hours.
	hours := make([]clockHour, 24)
	for i := 0; i < 24; i++ {
		if ch, ok := hourMap[i]; ok {
			hours[i] = ch
		} else {
			hours[i] = clockHour{Hour: i, Streams: 0, Minutes: 0}
		}
	}

	c.JSON(http.StatusOK, statsClockResponse{Hours: hours})
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func joinArtistNames(artists []spotify.Artist) string {
	names := make([]string, len(artists))
	for i, a := range artists {
		names[i] = a.Name
	}
	return strings.Join(names, ", ")
}

// fetchEntityImages looks up image URLs from entity_metadata for the given
// entity type and IDs. Returns a map of entityID -> imageURL.
func (h *handlers) fetchEntityImages(ctx context.Context, entityType string, ids []string) map[string]string {
	result := make(map[string]string, len(ids))
	for _, id := range ids {
		var imgURL sql.NullString
		_ = h.db.QueryRowContext(ctx,
			`SELECT image_url FROM entity_metadata WHERE entity_type = $1 AND entity_id = $2`,
			entityType, id,
		).Scan(&imgURL)
		if imgURL.Valid && imgURL.String != "" {
			result[id] = imgURL.String
		}
	}
	return result
}
