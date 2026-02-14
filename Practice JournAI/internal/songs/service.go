package songs

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"

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
		Title:  req.Title,
		Artist: req.Artist,
		Genre:  genre,
		Notes:  req.Notes,
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

func (s *Service) SearchMusicBrainz(ctx context.Context, query string) ([]MusicBrainzResult, error) {
	// Use Lucene query syntax for better results: search recording title specifically
	luceneQuery := fmt.Sprintf("recording:\"%s\"", query)
	searchURL := fmt.Sprintf(
		"https://musicbrainz.org/ws/2/recording?query=%s&fmt=json&limit=15",
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
	var results []MusicBrainzResult
	for _, rec := range mbResp.Recordings {
		artist := ""
		if len(rec.ArtistCredit) > 0 {
			artist = rec.ArtistCredit[0].Artist.Name
		}
		key := rec.Title + "|" + artist
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		results = append(results, MusicBrainzResult{
			Title:  rec.Title,
			Artist: artist,
		})
	}
	return results, nil
}
