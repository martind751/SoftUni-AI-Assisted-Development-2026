package songs

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"net/url"
	"strconv"

	"github.com/google/uuid"
)

var (
	ErrNotFound        = errors.New("song not found")
	ErrInvalidID       = errors.New("invalid song ID")
	ErrInvalidGenre    = errors.New("invalid genre, must be: jazz, blues, rock_metal")
	ErrInvalidOrderBy  = errors.New("invalid order_by, must be: title, artist, created_at")
	ErrInvalidOrderDir = errors.New("invalid order_dir, must be: asc, desc")
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func containsAny(s string, substrs []string) bool {
	for _, sub := range substrs {
		if strings.Contains(s, sub) {
			return true
		}
	}
	return false
}

func validateGenre(s string) (Genre, error) {
	g := Genre(s)
	switch g {
	case GenreJazz, GenreBlues, GenreRockMetal:
		return g, nil
	default:
		return "", ErrInvalidGenre
	}
}

func (s *Service) List(ctx context.Context, genreFilter, orderBy, orderDir string) ([]SongResponse, error) {
	var filters ListFilters

	if genreFilter != "" {
		g, err := validateGenre(genreFilter)
		if err != nil {
			return nil, err
		}
		filters.Genre = &g
	}
	if orderBy != "" {
		switch orderBy {
		case "title", "artist", "created_at":
			filters.OrderBy = orderBy
		default:
			return nil, ErrInvalidOrderBy
		}
	}
	if orderDir != "" {
		switch orderDir {
		case "asc", "desc":
			filters.OrderDir = orderDir
		default:
			return nil, ErrInvalidOrderDir
		}
	}

	songs, err := s.repo.List(ctx, filters)
	if err != nil {
		return nil, err
	}
	responses := make([]SongResponse, len(songs))
	for i, song := range songs {
		responses[i] = song.toResponse()
	}
	return responses, nil
}

func (s *Service) GetByID(ctx context.Context, idStr string) (*SongResponse, error) {
	id, err := uuid.Parse(idStr)
	if err != nil {
		return nil, ErrInvalidID
	}
	song, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	resp := song.toResponse()
	return &resp, nil
}

func (s *Service) Create(ctx context.Context, req CreateSongRequest) (*SongResponse, error) {
	genre, err := validateGenre(req.Genre)
	if err != nil {
		return nil, err
	}

	song := &Song{
		Title:               req.Title,
		Artist:              req.Artist,
		Genre:               genre,
		Notes:               req.Notes,
		DurationSeconds:     req.DurationSeconds,
		Album:               req.Album,
		ReleaseYear:         req.ReleaseYear,
		MusicBrainzArtistID: req.MusicBrainzArtistID,
	}
	if err := s.repo.Create(ctx, song); err != nil {
		return nil, err
	}
	resp := song.toResponse()
	return &resp, nil
}

func (s *Service) Update(ctx context.Context, idStr string, req UpdateSongRequest) (*SongResponse, error) {
	id, err := uuid.Parse(idStr)
	if err != nil {
		return nil, ErrInvalidID
	}

	genre, err := validateGenre(req.Genre)
	if err != nil {
		return nil, err
	}

	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	existing.Title = req.Title
	existing.Artist = req.Artist
	existing.Genre = genre
	existing.Notes = req.Notes
	existing.DurationSeconds = req.DurationSeconds
	existing.Album = req.Album
	existing.ReleaseYear = req.ReleaseYear
	existing.MusicBrainzArtistID = req.MusicBrainzArtistID

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	resp := existing.toResponse()
	return &resp, nil
}

func (s *Service) Delete(ctx context.Context, idStr string) error {
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ErrInvalidID
	}
	n, err := s.repo.Delete(ctx, id)
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Service) SearchMusicBrainzArtists(ctx context.Context, query string) ([]MusicBrainzArtistResult, error) {
	// Split into words and wildcard the last term for type-ahead matching
	// e.g. "stan g" → "artist:(stan g*)" so partial words match while typing
	words := strings.Fields(query)
	if len(words) > 0 {
		words[len(words)-1] = words[len(words)-1] + "*"
	}
	luceneQuery := fmt.Sprintf("artist:(%s)", strings.Join(words, " "))
	searchURL := fmt.Sprintf(
		"https://musicbrainz.org/ws/2/artist?query=%s&fmt=json&limit=10",
		url.QueryEscape(luceneQuery),
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, searchURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "PracticeJournAI/1.0 (practice-journai)")
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var mbResp mbArtistSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&mbResp); err != nil {
		return nil, err
	}

	var results []MusicBrainzArtistResult
	for _, a := range mbResp.Artists {
		results = append(results, MusicBrainzArtistResult{
			ID:             a.ID,
			Name:           a.Name,
			Country:        a.Country,
			Disambiguation: a.Disambiguation,
		})
	}
	return results, nil
}

func (s *Service) SearchMusicBrainzRecordings(ctx context.Context, artistID, titleQuery string) ([]MusicBrainzRecordingResult, error) {
	// Base: filter by artist, exclude live/demo/remix/instrumental via comment field
	excludeFilter := "NOT comment:(live demo remix instrumental bootleg acoustic radio)"
	var luceneQuery string
	if titleQuery != "" {
		words := strings.Fields(titleQuery)
		if len(words) > 0 {
			words[len(words)-1] = words[len(words)-1] + "*"
		}
		luceneQuery = fmt.Sprintf("arid:%s AND recording:(%s) AND %s AND video:false",
			artistID, strings.Join(words, " "), excludeFilter)
	} else {
		luceneQuery = fmt.Sprintf("arid:%s AND %s AND video:false", artistID, excludeFilter)
	}
	searchURL := fmt.Sprintf(
		"https://musicbrainz.org/ws/2/recording?query=%s&fmt=json&limit=100",
		url.QueryEscape(luceneQuery),
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, searchURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "PracticeJournAI/1.0 (practice-journai)")
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var mbResp mbSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&mbResp); err != nil {
		return nil, err
	}

	seen := make(map[string]struct{})
	var results []MusicBrainzRecordingResult
	for _, rec := range mbResp.Recordings {
		// Skip video recordings
		if rec.Video {
			continue
		}

		// Skip recordings tagged as live/demo/remix/etc in disambiguation
		disLower := strings.ToLower(rec.Disambiguation)
		if containsAny(disLower, []string{"live", "demo", "remix", "instrumental", "bootleg", "acoustic", "radio"}) {
			continue
		}

		// Skip titles containing "(live)", "(demo)" etc.
		titleLower := strings.ToLower(rec.Title)
		if containsAny(titleLower, []string{"(live)", "(demo)", "(remix)", "(instrumental)", "(bootleg)", "(acoustic)"}) {
			continue
		}

		artist := ""
		if len(rec.ArtistCredit) > 0 {
			artist = rec.ArtistCredit[0].Artist.Name
		}

		key := rec.Title + "|" + artist
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}

		result := MusicBrainzRecordingResult{
			Title:  rec.Title,
			Artist: artist,
		}

		if rec.Length != nil {
			seconds := *rec.Length / 1000
			result.DurationSeconds = &seconds
		}

		if len(rec.Releases) > 0 && rec.Releases[0].Title != "" {
			album := rec.Releases[0].Title
			result.Album = &album
		}

		if len(rec.FirstReleaseDate) >= 4 {
			if year, err := strconv.Atoi(rec.FirstReleaseDate[:4]); err == nil {
				result.ReleaseYear = &year
			}
		}

		results = append(results, result)
	}
	return results, nil
}
