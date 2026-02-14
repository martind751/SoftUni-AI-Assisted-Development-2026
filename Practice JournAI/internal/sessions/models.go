package sessions

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type SessionStatus string

const (
	StatusPlanned   SessionStatus = "planned"
	StatusCompleted SessionStatus = "completed"
	StatusSkipped   SessionStatus = "skipped"
)

type Genre string

const (
	GenreJazz      Genre = "jazz"
	GenreBlues     Genre = "blues"
	GenreRockMetal Genre = "rock_metal"
)

type Session struct {
	bun.BaseModel `bun:"table:sessions,alias:s"`

	ID              uuid.UUID     `bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	CreatedAt       time.Time     `bun:"created_at,notnull,default:current_timestamp"`
	UpdatedAt       time.Time     `bun:"updated_at,notnull,default:current_timestamp"`
	DueDate         time.Time     `bun:"due_date,notnull,type:date"`
	Description     string        `bun:"description,notnull"`
	DurationMinutes *int          `bun:"duration_minutes"`
	EnergyLevel     *int          `bun:"energy_level"`
	Status          SessionStatus `bun:"status,notnull,default:'planned'"`
	Genre           Genre         `bun:"genre,notnull"`

	Notes []SessionNote `bun:"rel:has-many,join:id=session_id"`
}

type SessionNote struct {
	bun.BaseModel `bun:"table:session_notes,alias:sn"`

	ID        uuid.UUID `bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	SessionID uuid.UUID `bun:"session_id,notnull,type:uuid"`
	Content   string    `bun:"content,notnull"`
	CreatedAt time.Time `bun:"created_at,notnull,default:current_timestamp"`
}

type CreateSessionRequest struct {
	DueDate         string `json:"due_date" binding:"required"`
	Description     string `json:"description" binding:"required"`
	Genre           string `json:"genre" binding:"required"`
	DurationMinutes *int   `json:"duration_minutes"`
	EnergyLevel     *int   `json:"energy_level"`
	Status          string `json:"status"`
}

type UpdateSessionRequest struct {
	DueDate         string `json:"due_date" binding:"required"`
	Description     string `json:"description" binding:"required"`
	Genre           string `json:"genre" binding:"required"`
	Status          string `json:"status" binding:"required"`
	DurationMinutes *int   `json:"duration_minutes"`
	EnergyLevel     *int   `json:"energy_level"`
}

type CreateNoteRequest struct {
	Content string `json:"content" binding:"required"`
}

type SessionNoteResponse struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}

type SessionResponse struct {
	ID              string                `json:"id"`
	CreatedAt       string                `json:"created_at"`
	UpdatedAt       string                `json:"updated_at"`
	DueDate         string                `json:"due_date"`
	Description     string                `json:"description"`
	DurationMinutes *int                  `json:"duration_minutes"`
	EnergyLevel     *int                  `json:"energy_level"`
	Status          string                `json:"status"`
	Genre           string                `json:"genre"`
	Notes           []SessionNoteResponse `json:"notes"`
}

func (s *Session) toResponse() SessionResponse {
	noteResponses := make([]SessionNoteResponse, len(s.Notes))
	for i, n := range s.Notes {
		noteResponses[i] = SessionNoteResponse{
			ID:        n.ID.String(),
			Content:   n.Content,
			CreatedAt: n.CreatedAt.Format(time.RFC3339),
		}
	}
	return SessionResponse{
		ID:              s.ID.String(),
		CreatedAt:       s.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       s.UpdatedAt.Format(time.RFC3339),
		DueDate:         s.DueDate.Format("2006-01-02"),
		Description:     s.Description,
		DurationMinutes: s.DurationMinutes,
		EnergyLevel:     s.EnergyLevel,
		Status:          string(s.Status),
		Genre:           string(s.Genre),
		Notes:           noteResponses,
	}
}
