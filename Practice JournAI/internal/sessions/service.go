package sessions

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrNotFound      = errors.New("session not found")
	ErrNoteNotFound  = errors.New("note not found")
	ErrInvalidID     = errors.New("invalid session ID")
	ErrInvalidNoteID = errors.New("invalid note ID")
	ErrInvalidDate   = errors.New("invalid date format, expected YYYY-MM-DD")
	ErrInvalidGenre  = errors.New("invalid genre, must be: jazz, blues, rock_metal")
	ErrInvalidStatus = errors.New("invalid status, must be: planned, completed, skipped")
	ErrInvalidEnergy  = errors.New("invalid energy level, must be between 1 and 5")
	ErrInvalidOrderBy = errors.New("invalid order_by, must be: due_date, created_at")
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

func validateStatus(s string) (SessionStatus, error) {
	st := SessionStatus(s)
	switch st {
	case StatusPlanned, StatusCompleted, StatusSkipped:
		return st, nil
	default:
		return "", ErrInvalidStatus
	}
}

func validateEnergyLevel(level *int) error {
	if level != nil && (*level < 1 || *level > 5) {
		return ErrInvalidEnergy
	}
	return nil
}

func (s *Service) List(ctx context.Context, genreFilter, statusFilter, orderBy, orderDir string) ([]SessionResponse, error) {
	var filters ListFilters

	if genreFilter != "" {
		g, err := validateGenre(genreFilter)
		if err != nil {
			return nil, err
		}
		filters.Genre = &g
	}
	if statusFilter != "" {
		st, err := validateStatus(statusFilter)
		if err != nil {
			return nil, err
		}
		filters.Status = &st
	}
	if orderBy != "" {
		switch orderBy {
		case "due_date", "created_at":
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

	sessions, err := s.repo.List(ctx, filters)
	if err != nil {
		return nil, err
	}
	responses := make([]SessionResponse, len(sessions))
	for i, session := range sessions {
		responses[i] = session.toResponse()
	}
	return responses, nil
}

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

func (s *Service) Create(ctx context.Context, req CreateSessionRequest) (*SessionResponse, error) {
	dueDate, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		return nil, ErrInvalidDate
	}

	genre, err := validateGenre(req.Genre)
	if err != nil {
		return nil, err
	}

	status := StatusPlanned
	if req.Status != "" {
		status, err = validateStatus(req.Status)
		if err != nil {
			return nil, err
		}
	}

	if err := validateEnergyLevel(req.EnergyLevel); err != nil {
		return nil, err
	}

	session := &Session{
		DueDate:         dueDate,
		Description:     req.Description,
		Genre:           genre,
		Status:          status,
		DurationMinutes: req.DurationMinutes,
		EnergyLevel:     req.EnergyLevel,
	}
	if err := s.repo.Create(ctx, session); err != nil {
		return nil, err
	}
	resp := session.toResponse()
	return &resp, nil
}

func (s *Service) Update(ctx context.Context, idStr string, req UpdateSessionRequest) (*SessionResponse, error) {
	id, err := uuid.Parse(idStr)
	if err != nil {
		return nil, ErrInvalidID
	}
	dueDate, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		return nil, ErrInvalidDate
	}

	genre, err := validateGenre(req.Genre)
	if err != nil {
		return nil, err
	}

	status, err := validateStatus(req.Status)
	if err != nil {
		return nil, err
	}

	if err := validateEnergyLevel(req.EnergyLevel); err != nil {
		return nil, err
	}

	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	existing.DueDate = dueDate
	existing.Description = req.Description
	existing.Genre = genre
	existing.Status = status
	existing.DurationMinutes = req.DurationMinutes
	existing.EnergyLevel = req.EnergyLevel

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

func (s *Service) CreateNote(ctx context.Context, sessionIDStr string, req CreateNoteRequest) (*SessionNoteResponse, error) {
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		return nil, ErrInvalidID
	}

	// Verify session exists
	_, err = s.repo.GetByID(ctx, sessionID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	note := &SessionNote{
		SessionID: sessionID,
		Content:   req.Content,
	}
	if err := s.repo.CreateNote(ctx, note); err != nil {
		return nil, err
	}
	return &SessionNoteResponse{
		ID:        note.ID.String(),
		Content:   note.Content,
		CreatedAt: note.CreatedAt.Format(time.RFC3339),
	}, nil
}

func (s *Service) DeleteNote(ctx context.Context, sessionIDStr, noteIDStr string) error {
	_, err := uuid.Parse(sessionIDStr)
	if err != nil {
		return ErrInvalidID
	}
	noteID, err := uuid.Parse(noteIDStr)
	if err != nil {
		return ErrInvalidNoteID
	}
	n, err := s.repo.DeleteNote(ctx, noteID)
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNoteNotFound
	}
	return nil
}
