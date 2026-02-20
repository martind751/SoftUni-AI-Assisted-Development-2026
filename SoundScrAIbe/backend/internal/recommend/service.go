package recommend

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"sort"
	"strings"
	"sync"
	"time"

	"soundscraibe/internal/ai"
	"soundscraibe/internal/spotify"
)

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

// ResolvedRecommendation is the final enriched recommendation returned to the frontend.
type ResolvedRecommendation struct {
	Type           string   `json:"type"`
	SpotifyID      string   `json:"spotify_id"`
	Title          string   `json:"title"`
	Artist         string   `json:"artist"`
	Album          string   `json:"album,omitempty"`
	Year           string   `json:"year,omitempty"`
	ImageURL       string   `json:"image_url,omitempty"`
	SpotifyURL     string   `json:"spotify_url,omitempty"`
	Why            string   `json:"why"`
	DiscoveryAngle string   `json:"discovery_angle"`
	MoodTags       []string `json:"mood_tags"`
	Resolved       bool     `json:"resolved"`
}

// Response is the full recommendation response returned to the frontend.
type Response struct {
	TasteSummary    string                   `json:"taste_summary"`
	Recommendations []ResolvedRecommendation `json:"recommendations"`
	Mode            string                   `json:"mode"`
	UserPrompt      string                   `json:"user_prompt,omitempty"`
}

// HistoryItem represents a saved recommendation session.
type HistoryItem struct {
	ID              int64                    `json:"id"`
	Mode            string                   `json:"mode"`
	UserPrompt      string                   `json:"user_prompt"`
	TasteSummary    string                   `json:"taste_summary"`
	Recommendations []ResolvedRecommendation `json:"recommendations"`
	CreatedAt       time.Time                `json:"created_at"`
}

// ---------------------------------------------------------------------------
// GatherTasteProfile
// ---------------------------------------------------------------------------

// GatherTasteProfile collects data from DB and Spotify API concurrently.
// It uses goroutines for parallel data fetching and is graceful about partial failures.
func GatherTasteProfile(ctx context.Context, db *sql.DB, accessToken string, userID int64) (*ai.TasteProfile, error) {
	var (
		mu   sync.Mutex
		wg   sync.WaitGroup
		errs []error
	)

	// Results from Spotify calls
	var (
		shortTermArtists  *spotify.TopArtistsResponse
		mediumTermArtists *spotify.TopArtistsResponse
		topTracks         *spotify.TopTracksResponse
		recentlyPlayed    *spotify.RecentlyPlayedResponse
	)

	// Results from DB queries
	var (
		highRated      []ai.RatedEntry
		onRotation     []ai.ShelfEntry
		userTags       []string
		listeningHours []ai.HourEntry
	)

	spotifyFailed := 0

	addErr := func(err error) {
		mu.Lock()
		errs = append(errs, err)
		mu.Unlock()
	}

	// --- Spotify goroutines ---

	wg.Add(1)
	go func() {
		defer wg.Done()
		res, err := spotify.GetTopArtists(ctx, accessToken, "short_term", 20)
		if err != nil {
			log.Printf("gather: short_term top artists failed (non-fatal): %v", err)
			addErr(err)
			mu.Lock()
			spotifyFailed++
			mu.Unlock()
			return
		}
		mu.Lock()
		shortTermArtists = res
		mu.Unlock()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		res, err := spotify.GetTopArtists(ctx, accessToken, "medium_term", 30)
		if err != nil {
			log.Printf("gather: medium_term top artists failed (non-fatal): %v", err)
			addErr(err)
			mu.Lock()
			spotifyFailed++
			mu.Unlock()
			return
		}
		mu.Lock()
		mediumTermArtists = res
		mu.Unlock()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		res, err := spotify.GetTopTracks(ctx, accessToken, "medium_term", 20)
		if err != nil {
			log.Printf("gather: top tracks failed (non-fatal): %v", err)
			addErr(err)
			mu.Lock()
			spotifyFailed++
			mu.Unlock()
			return
		}
		mu.Lock()
		topTracks = res
		mu.Unlock()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		res, err := spotify.GetRecentlyPlayed(ctx, accessToken)
		if err != nil {
			log.Printf("gather: recently played failed (non-fatal): %v", err)
			addErr(err)
			mu.Lock()
			spotifyFailed++
			mu.Unlock()
			return
		}
		mu.Lock()
		recentlyPlayed = res
		mu.Unlock()
	}()

	// --- DB goroutines ---

	wg.Add(1)
	go func() {
		defer wg.Done()
		rows, err := db.QueryContext(ctx,
			`SELECT r.entity_type, r.entity_id, r.score, em.name, em.extra_json
			 FROM ratings r
			 LEFT JOIN entity_metadata em ON r.entity_type = em.entity_type AND r.entity_id = em.entity_id
			 WHERE r.user_id = $1 AND r.score >= 8
			 ORDER BY r.score DESC
			 LIMIT 30`, userID)
		if err != nil {
			log.Printf("gather: high rated query failed: %v", err)
			addErr(fmt.Errorf("querying high rated: %w", err))
			return
		}
		defer rows.Close()

		var results []ai.RatedEntry
		for rows.Next() {
			var (
				entityType string
				entityID   string
				score      int
				name       sql.NullString
				extraJSON  sql.NullString
			)
			if err := rows.Scan(&entityType, &entityID, &score, &name, &extraJSON); err != nil {
				log.Printf("gather: high rated scan failed: %v", err)
				continue
			}
			entry := ai.RatedEntry{
				EntityType: entityType,
				Name:       name.String,
				Score:      score,
			}
			// Parse artist_name from extra_json for tracks and albums.
			if extraJSON.Valid && extraJSON.String != "" && (entityType == "track" || entityType == "album") {
				entry.Artist = parseArtistName(extraJSON.String)
			}
			if entry.Name == "" {
				entry.Name = entityID // fallback to ID if no metadata
			}
			results = append(results, entry)
		}
		mu.Lock()
		highRated = results
		mu.Unlock()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		rows, err := db.QueryContext(ctx,
			`SELECT s.entity_type, s.entity_id, em.name, em.extra_json
			 FROM shelves s
			 LEFT JOIN entity_metadata em ON s.entity_type = em.entity_type AND s.entity_id = em.entity_id
			 WHERE s.user_id = $1 AND s.status = 'on_rotation'
			 LIMIT 20`, userID)
		if err != nil {
			log.Printf("gather: on rotation query failed: %v", err)
			addErr(fmt.Errorf("querying on rotation: %w", err))
			return
		}
		defer rows.Close()

		var results []ai.ShelfEntry
		for rows.Next() {
			var (
				entityType string
				entityID   string
				name       sql.NullString
				extraJSON  sql.NullString
			)
			if err := rows.Scan(&entityType, &entityID, &name, &extraJSON); err != nil {
				log.Printf("gather: on rotation scan failed: %v", err)
				continue
			}
			entry := ai.ShelfEntry{
				EntityType: entityType,
				Name:       name.String,
			}
			if extraJSON.Valid && extraJSON.String != "" && (entityType == "track" || entityType == "album") {
				entry.Artist = parseArtistName(extraJSON.String)
			}
			if entry.Name == "" {
				entry.Name = entityID
			}
			results = append(results, entry)
		}
		mu.Lock()
		onRotation = results
		mu.Unlock()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		rows, err := db.QueryContext(ctx,
			`SELECT name FROM tags WHERE user_id = $1 ORDER BY name`, userID)
		if err != nil {
			log.Printf("gather: tags query failed: %v", err)
			addErr(fmt.Errorf("querying tags: %w", err))
			return
		}
		defer rows.Close()

		var results []string
		for rows.Next() {
			var name string
			if err := rows.Scan(&name); err != nil {
				continue
			}
			results = append(results, name)
		}
		mu.Lock()
		userTags = results
		mu.Unlock()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		rows, err := db.QueryContext(ctx,
			`SELECT EXTRACT(HOUR FROM played_at)::int AS hour, COUNT(*) AS cnt
			 FROM listening_history
			 WHERE user_id = $1
			 GROUP BY hour
			 ORDER BY cnt DESC
			 LIMIT 3`, userID)
		if err != nil {
			log.Printf("gather: listening hours query failed: %v", err)
			addErr(fmt.Errorf("querying listening hours: %w", err))
			return
		}
		defer rows.Close()

		var results []ai.HourEntry
		for rows.Next() {
			var h ai.HourEntry
			if err := rows.Scan(&h.Hour, &h.Count); err != nil {
				continue
			}
			results = append(results, h)
		}
		mu.Lock()
		listeningHours = results
		mu.Unlock()
	}()

	wg.Wait()

	// If all 4 Spotify calls failed, that's a problem (no Spotify data at all).
	if spotifyFailed == 4 {
		return nil, fmt.Errorf("all Spotify API calls failed; cannot build taste profile")
	}

	// --- Merge top artists (short_term preferred, then medium_term) ---
	seen := make(map[string]bool)
	var mergedArtists []ai.ArtistEntry

	if shortTermArtists != nil {
		for _, a := range shortTermArtists.Items {
			if !seen[a.Name] {
				seen[a.Name] = true
				mergedArtists = append(mergedArtists, ai.ArtistEntry{
					Name:   a.Name,
					Genres: a.Genres,
				})
			}
		}
	}
	if mediumTermArtists != nil {
		for _, a := range mediumTermArtists.Items {
			if !seen[a.Name] {
				seen[a.Name] = true
				mergedArtists = append(mergedArtists, ai.ArtistEntry{
					Name:   a.Name,
					Genres: a.Genres,
				})
			}
		}
	}

	// --- Extract top genres by frequency ---
	genreCount := make(map[string]int)
	for _, a := range mergedArtists {
		for _, g := range a.Genres {
			genreCount[g]++
		}
	}

	type genrePair struct {
		name  string
		count int
	}
	genrePairs := make([]genrePair, 0, len(genreCount))
	for name, count := range genreCount {
		genrePairs = append(genrePairs, genrePair{name, count})
	}
	sort.Slice(genrePairs, func(i, j int) bool {
		return genrePairs[i].count > genrePairs[j].count
	})
	topGenres := make([]string, 0, 10)
	for i, gp := range genrePairs {
		if i >= 10 {
			break
		}
		topGenres = append(topGenres, gp.name)
	}

	// --- Build top tracks ---
	var profileTracks []ai.TrackEntry
	if topTracks != nil {
		for _, t := range topTracks.Items {
			artistName := ""
			if len(t.Artists) > 0 {
				names := make([]string, len(t.Artists))
				for i, a := range t.Artists {
					names[i] = a.Name
				}
				artistName = strings.Join(names, ", ")
			}
			profileTracks = append(profileTracks, ai.TrackEntry{
				Name:   t.Name,
				Artist: artistName,
			})
		}
	}

	// --- Build recent plays (deduplicated by track ID, first 20) ---
	var recentPlays []ai.RecentEntry
	if recentlyPlayed != nil {
		seenTracks := make(map[string]bool)
		for _, item := range recentlyPlayed.Items {
			if seenTracks[item.Track.ID] {
				continue
			}
			seenTracks[item.Track.ID] = true
			artistName := ""
			if len(item.Track.Artists) > 0 {
				names := make([]string, len(item.Track.Artists))
				for i, a := range item.Track.Artists {
					names[i] = a.Name
				}
				artistName = strings.Join(names, ", ")
			}
			recentPlays = append(recentPlays, ai.RecentEntry{
				Name:   item.Track.Name,
				Artist: artistName,
			})
			if len(recentPlays) >= 20 {
				break
			}
		}
	}

	profile := &ai.TasteProfile{
		TopArtists:     mergedArtists,
		TopTracks:      profileTracks,
		RecentPlays:    recentPlays,
		HighRated:      highRated,
		OnRotation:     onRotation,
		UserTags:       userTags,
		TopGenres:      topGenres,
		ListeningHours: listeningHours,
	}

	return profile, nil
}

// parseArtistName extracts "artist_name" from an entity_metadata extra_json string.
func parseArtistName(extraJSON string) string {
	var m map[string]interface{}
	if err := json.Unmarshal([]byte(extraJSON), &m); err != nil {
		return ""
	}
	if name, ok := m["artist_name"].(string); ok {
		return name
	}
	return ""
}

// ---------------------------------------------------------------------------
// ResolveAll
// ---------------------------------------------------------------------------

// ResolveAll takes Claude's raw recommendations and searches Spotify for each one concurrently.
// It returns the resolved array in the same order as the input.
func ResolveAll(ctx context.Context, accessToken string, recs []ai.RawRecommendation) []ResolvedRecommendation {
	results := make([]ResolvedRecommendation, len(recs))
	var wg sync.WaitGroup

	for i, rec := range recs {
		wg.Add(1)
		go func(idx int, r ai.RawRecommendation) {
			defer wg.Done()

			artistName := r.ArtistName()
			resolved := ResolvedRecommendation{
				Type:           r.Type,
				Title:          r.Title,
				Artist:         artistName,
				Album:          r.Album,
				Year:           r.YearString(),
				Why:            r.Why,
				DiscoveryAngle: r.DiscoveryAngle,
				MoodTags:       r.MoodTags,
				Resolved:       false,
			}

			// Build search query based on type.
			var query, searchType string
			switch r.Type {
			case "track":
				query = r.Title + " " + artistName
				searchType = "track"
			case "album":
				query = r.Title + " " + artistName
				searchType = "album"
			case "artist":
				query = artistName
				searchType = "artist"
			default:
				query = r.Title + " " + artistName
				searchType = "track"
			}

			searchResp, err := spotify.Search(ctx, accessToken, query, searchType, 1)
			if err != nil {
				log.Printf("resolve: search failed for %q (non-fatal): %v", query, err)
				results[idx] = resolved
				return
			}

			switch searchType {
			case "track":
				if searchResp.Tracks != nil && len(searchResp.Tracks.Items) > 0 {
					t := searchResp.Tracks.Items[0]
					resolved.SpotifyID = t.ID
					if len(t.Album.Images) > 0 {
						resolved.ImageURL = t.Album.Images[0].URL
					}
					resolved.SpotifyURL = fmt.Sprintf("https://open.spotify.com/track/%s", t.ID)
					resolved.Resolved = true
				}
			case "album":
				if searchResp.Albums != nil && len(searchResp.Albums.Items) > 0 {
					a := searchResp.Albums.Items[0]
					resolved.SpotifyID = a.ID
					if len(a.Images) > 0 {
						resolved.ImageURL = a.Images[0].URL
					}
					resolved.SpotifyURL = a.ExternalURLs.Spotify
					resolved.Resolved = true
				}
			case "artist":
				if searchResp.Artists != nil && len(searchResp.Artists.Items) > 0 {
					a := searchResp.Artists.Items[0]
					resolved.SpotifyID = a.ID
					if len(a.Images) > 0 {
						resolved.ImageURL = a.Images[0].URL
					}
					resolved.SpotifyURL = a.ExternalURLs.Spotify
					resolved.Resolved = true
				}
			}

			results[idx] = resolved
		}(i, rec)
	}

	wg.Wait()

	// Ensure nil mood_tags become empty slices for consistent JSON.
	for i := range results {
		if results[i].MoodTags == nil {
			results[i].MoodTags = []string{}
		}
	}

	return results
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

// SaveRecommendation persists a recommendation session to the database.
func SaveRecommendation(ctx context.Context, db *sql.DB, userID int64, mode, userPrompt, tasteSummary string, results []ResolvedRecommendation) (int64, error) {
	resultsJSON, err := json.Marshal(results)
	if err != nil {
		return 0, fmt.Errorf("marshalling results: %w", err)
	}

	var id int64
	err = db.QueryRowContext(ctx,
		`INSERT INTO ai_recommendations (user_id, mode, user_prompt, taste_summary, results_json)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id`,
		userID, mode, userPrompt, tasteSummary, resultsJSON,
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("saving recommendation: %w", err)
	}

	return id, nil
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

// CheckRateLimit checks if the user has a recommendation within the last 60 seconds.
// Returns 0 if not rate-limited, or the number of seconds remaining (1-60) if rate-limited.
func CheckRateLimit(ctx context.Context, db *sql.DB, userID int64) (int, error) {
	var remaining sql.NullInt64
	err := db.QueryRowContext(ctx,
		`SELECT CEIL(EXTRACT(EPOCH FROM (created_at + interval '60 seconds' - now())))::int
		 FROM ai_recommendations
		 WHERE user_id = $1 AND created_at > now() - interval '60 seconds'
		 ORDER BY created_at DESC
		 LIMIT 1`, userID,
	).Scan(&remaining)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, nil
		}
		return 0, fmt.Errorf("checking rate limit: %w", err)
	}

	if !remaining.Valid || remaining.Int64 <= 0 {
		return 0, nil
	}

	return int(remaining.Int64), nil
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

// GetHistory returns the user's recommendation history (most recent first).
func GetHistory(ctx context.Context, db *sql.DB, userID int64) ([]HistoryItem, error) {
	rows, err := db.QueryContext(ctx,
		`SELECT id, mode, user_prompt, taste_summary, results_json, created_at
		 FROM ai_recommendations
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT 20`, userID)
	if err != nil {
		return nil, fmt.Errorf("querying recommendation history: %w", err)
	}
	defer rows.Close()

	var items []HistoryItem
	for rows.Next() {
		item, err := scanHistoryItem(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating recommendation history: %w", err)
	}

	if items == nil {
		items = []HistoryItem{}
	}

	return items, nil
}

// GetHistoryItem returns a single recommendation session by ID, scoped to the user.
func GetHistoryItem(ctx context.Context, db *sql.DB, userID int64, recID int64) (*HistoryItem, error) {
	row := db.QueryRowContext(ctx,
		`SELECT id, mode, user_prompt, taste_summary, results_json, created_at
		 FROM ai_recommendations
		 WHERE id = $1 AND user_id = $2`, recID, userID)

	var (
		id           int64
		mode         string
		userPrompt   string
		tasteSummary string
		resultsJSON  []byte
		createdAt    time.Time
	)
	if err := row.Scan(&id, &mode, &userPrompt, &tasteSummary, &resultsJSON, &createdAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("getting recommendation item: %w", err)
	}

	var recs []ResolvedRecommendation
	if err := json.Unmarshal(resultsJSON, &recs); err != nil {
		return nil, fmt.Errorf("parsing recommendation results: %w", err)
	}

	return &HistoryItem{
		ID:              id,
		Mode:            mode,
		UserPrompt:      userPrompt,
		TasteSummary:    tasteSummary,
		Recommendations: recs,
		CreatedAt:       createdAt,
	}, nil
}

// scanHistoryItem scans a single row from a recommendation history query.
func scanHistoryItem(rows *sql.Rows) (*HistoryItem, error) {
	var (
		id           int64
		mode         string
		userPrompt   string
		tasteSummary string
		resultsJSON  []byte
		createdAt    time.Time
	)
	if err := rows.Scan(&id, &mode, &userPrompt, &tasteSummary, &resultsJSON, &createdAt); err != nil {
		return nil, fmt.Errorf("scanning recommendation row: %w", err)
	}

	var recs []ResolvedRecommendation
	if err := json.Unmarshal(resultsJSON, &recs); err != nil {
		return nil, fmt.Errorf("parsing recommendation results: %w", err)
	}

	return &HistoryItem{
		ID:              id,
		Mode:            mode,
		UserPrompt:      userPrompt,
		TasteSummary:    tasteSummary,
		Recommendations: recs,
		CreatedAt:       createdAt,
	}, nil
}
