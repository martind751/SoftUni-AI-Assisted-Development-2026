package sessions

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

// Session represents a practice session stored in the database.
type Session struct {
	bun.BaseModel `bun:"table:sessions,alias:s"`

	ID          uuid.UUID `bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	CreatedAt   time.Time `bun:"created_at,notnull,default:current_timestamp"`
	UpdatedAt   time.Time `bun:"updated_at,notnull,default:current_timestamp"`
	DueDate     time.Time `bun:"due_date,notnull,type:date"`
	Description string    `bun:"description,notnull"`
	Notes       *string   `bun:"notes"`
}

// CreateSessionRequest is the expected JSON body for creating a session.
type CreateSessionRequest struct {
	DueDate     string  `json:"due_date" binding:"required"`
	Description string  `json:"description" binding:"required"`
	Notes       *string `json:"notes"`
}

// UpdateSessionRequest is the expected JSON body for updating a session.
type UpdateSessionRequest struct {
	DueDate     string  `json:"due_date" binding:"required"`
	Description string  `json:"description" binding:"required"`
	Notes       *string `json:"notes"`
}

// SessionResponse is the JSON shape returned to API consumers.
type SessionResponse struct {
	ID          string  `json:"id"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
	DueDate     string  `json:"due_date"`
	Description string  `json:"description"`
	Notes       *string `json:"notes"`
}

func (s *Session) toResponse() SessionResponse {
	return SessionResponse{
		ID:          s.ID.String(),
		CreatedAt:   s.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   s.UpdatedAt.Format(time.RFC3339),
		DueDate:     s.DueDate.Format("2006-01-02"),
		Description: s.Description,
		Notes:       s.Notes,
	}
}
