package songs

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type Genre string

const (
	GenreJazz      Genre = "jazz"
	GenreBlues     Genre = "blues"
	GenreRockMetal Genre = "rock_metal"
)

type Song struct {
	bun.BaseModel `bun:"table:songs,alias:so"`

	ID                  uuid.UUID `bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	CreatedAt           time.Time `bun:"created_at,notnull,default:current_timestamp"`
	UpdatedAt           time.Time `bun:"updated_at,notnull,default:current_timestamp"`
	Title               string    `bun:"title,notnull"`
	Artist              string    `bun:"artist,notnull"`
	Genre               Genre     `bun:"genre,notnull"`
	Notes               *string   `bun:"notes"`
	DurationSeconds     *int      `bun:"duration_seconds"`
	Album               *string   `bun:"album"`
	ReleaseYear         *int      `bun:"release_year"`
	MusicBrainzArtistID *string   `bun:"musicbrainz_artist_id"`
}

type CreateSongRequest struct {
	Title               string  `json:"title" binding:"required"`
	Artist              string  `json:"artist" binding:"required"`
	Genre               string  `json:"genre" binding:"required"`
	Notes               *string `json:"notes"`
	DurationSeconds     *int    `json:"duration_seconds"`
	Album               *string `json:"album"`
	ReleaseYear         *int    `json:"release_year"`
	MusicBrainzArtistID *string `json:"musicbrainz_artist_id"`
}

type UpdateSongRequest struct {
	Title               string  `json:"title" binding:"required"`
	Artist              string  `json:"artist" binding:"required"`
	Genre               string  `json:"genre" binding:"required"`
	Notes               *string `json:"notes"`
	DurationSeconds     *int    `json:"duration_seconds"`
	Album               *string `json:"album"`
	ReleaseYear         *int    `json:"release_year"`
	MusicBrainzArtistID *string `json:"musicbrainz_artist_id"`
}

type SongResponse struct {
	ID                  string  `json:"id"`
	CreatedAt           string  `json:"created_at"`
	UpdatedAt           string  `json:"updated_at"`
	Title               string  `json:"title"`
	Artist              string  `json:"artist"`
	Genre               string  `json:"genre"`
	Notes               *string `json:"notes"`
	DurationSeconds     *int    `json:"duration_seconds"`
	Album               *string `json:"album"`
	ReleaseYear         *int    `json:"release_year"`
	MusicBrainzArtistID *string `json:"musicbrainz_artist_id"`
}

func (s *Song) toResponse() SongResponse {
	return SongResponse{
		ID:                  s.ID.String(),
		CreatedAt:           s.CreatedAt.Format(time.RFC3339),
		UpdatedAt:           s.UpdatedAt.Format(time.RFC3339),
		Title:               s.Title,
		Artist:              s.Artist,
		Genre:               string(s.Genre),
		Notes:               s.Notes,
		DurationSeconds:     s.DurationSeconds,
		Album:               s.Album,
		ReleaseYear:         s.ReleaseYear,
		MusicBrainzArtistID: s.MusicBrainzArtistID,
	}
}

// MusicBrainz types

// Artist search result
type MusicBrainzArtistResult struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Country        string `json:"country"`
	Disambiguation string `json:"disambiguation"`
}

// Recording result with extra fields
type MusicBrainzRecordingResult struct {
	Title           string  `json:"title"`
	Artist          string  `json:"artist"`
	DurationSeconds *int    `json:"duration_seconds"`
	Album           *string `json:"album"`
	ReleaseYear     *int    `json:"release_year"`
}

// MusicBrainz API deserialization (internal)
type mbArtistSearchResponse struct {
	Artists []mbArtistEntry `json:"artists"`
}

type mbArtistEntry struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Country        string `json:"country"`
	Disambiguation string `json:"disambiguation"`
	Type           string `json:"type"`
}

type mbSearchResponse struct {
	Recordings []mbRecording `json:"recordings"`
}

type mbRecording struct {
	Title            string           `json:"title"`
	Disambiguation   string           `json:"disambiguation"`
	Length           *int             `json:"length"`
	FirstReleaseDate string           `json:"first-release-date"`
	ArtistCredit     []mbArtistCredit `json:"artist-credit"`
	Releases         []mbRelease      `json:"releases"`
	Video            bool             `json:"video"`
}

type mbArtistCredit struct {
	Artist mbArtist `json:"artist"`
}

type mbArtist struct {
	Name string `json:"name"`
}

type mbRelease struct {
	Title string `json:"title"`
}
