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

	ID        uuid.UUID `bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	CreatedAt time.Time `bun:"created_at,notnull,default:current_timestamp"`
	UpdatedAt time.Time `bun:"updated_at,notnull,default:current_timestamp"`
	Title     string    `bun:"title,notnull"`
	Artist    string    `bun:"artist,notnull"`
	Genre     Genre     `bun:"genre,notnull"`
	Notes     *string   `bun:"notes"`
}

type CreateSongRequest struct {
	Title  string  `json:"title" binding:"required"`
	Artist string  `json:"artist" binding:"required"`
	Genre  string  `json:"genre" binding:"required"`
	Notes  *string `json:"notes"`
}

type UpdateSongRequest struct {
	Title  string  `json:"title" binding:"required"`
	Artist string  `json:"artist" binding:"required"`
	Genre  string  `json:"genre" binding:"required"`
	Notes  *string `json:"notes"`
}

type SongResponse struct {
	ID        string  `json:"id"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
	Title     string  `json:"title"`
	Artist    string  `json:"artist"`
	Genre     string  `json:"genre"`
	Notes     *string `json:"notes"`
}

func (s *Song) toResponse() SongResponse {
	return SongResponse{
		ID:        s.ID.String(),
		CreatedAt: s.CreatedAt.Format(time.RFC3339),
		UpdatedAt: s.UpdatedAt.Format(time.RFC3339),
		Title:     s.Title,
		Artist:    s.Artist,
		Genre:     string(s.Genre),
		Notes:     s.Notes,
	}
}

// MusicBrainz types

type MusicBrainzResult struct {
	Title  string `json:"title"`
	Artist string `json:"artist"`
}

type mbSearchResponse struct {
	Recordings []mbRecording `json:"recordings"`
}

type mbRecording struct {
	Title        string           `json:"title"`
	ArtistCredit []mbArtistCredit `json:"artist-credit"`
}

type mbArtistCredit struct {
	Artist mbArtist `json:"artist"`
}

type mbArtist struct {
	Name string `json:"name"`
}
