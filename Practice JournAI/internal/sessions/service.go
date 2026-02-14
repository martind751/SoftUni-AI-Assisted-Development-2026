package sessions

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrNotFound    = errors.New("session not found")
	ErrInvalidID   = errors.New("invalid session ID")
	ErrInvalidDate = errors.New("invalid date format, expected YYYY-MM-DD")
)

// Service contains business logic for practice sessions.
type Service struct {
	repo *Repository
}

// NewService creates a new sessions service backed by the given repository.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// List returns all sessions as response DTOs.
func (s *Service) List(ctx context.Context) ([]SessionResponse, error) {
	sessions, err := s.repo.List(ctx)
	if err != nil {
		return nil, err
	}
	responses := make([]SessionResponse, len(sessions))
	for i, session := range sessions {
		responses[i] = session.toResponse()
	}
	return responses, nil
}

// GetByID retrieves a single session by its string ID.
func (s *Service) GetByID(ctx context.Context, idStr string) (*SessionResponse, error) {
	id, err := uuid.Parse(idStr)
	if err != nil {
		return nil, ErrInvalidID
	}
	session, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	resp := session.toResponse()
	return &resp, nil
}

// Create validates the request, persists a new session, and returns the response.
func (s *Service) Create(ctx context.Context, req CreateSessionRequest) (*SessionResponse, error) {
	dueDate, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		return nil, ErrInvalidDate
	}
	session := &Session{
		DueDate:     dueDate,
		Description: req.Description,
		Notes:       req.Notes,
	}
	if err := s.repo.Create(ctx, session); err != nil {
		return nil, err
	}
	resp := session.toResponse()
	return &resp, nil
}

// Update validates the request, updates an existing session, and returns the response.
func (s *Service) Update(ctx context.Context, idStr string, req UpdateSessionRequest) (*SessionResponse, error) {
	id, err := uuid.Parse(idStr)
	if err != nil {
		return nil, ErrInvalidID
	}
	dueDate, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		return nil, ErrInvalidDate
	}
	// Verify session exists
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	existing.DueDate = dueDate
	existing.Description = req.Description
	existing.Notes = req.Notes
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	resp := existing.toResponse()
	return &resp, nil
}

// Delete removes a session by its string ID.
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
