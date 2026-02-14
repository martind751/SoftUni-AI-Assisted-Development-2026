package sessions

import (
	"context"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

// Repository provides data access methods for practice sessions.
type Repository struct {
	db *bun.DB
}

// NewRepository creates a new sessions repository with the given database connection.
func NewRepository(db *bun.DB) *Repository {
	return &Repository{db: db}
}

// List returns all sessions ordered by due date ascending.
func (r *Repository) List(ctx context.Context) ([]Session, error) {
	var sessions []Session
	err := r.db.NewSelect().
		Model(&sessions).
		OrderExpr("due_date ASC").
		Scan(ctx)
	if err != nil {
		return nil, err
	}
	return sessions, nil
}

// GetByID returns a single session by its UUID.
func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Session, error) {
	session := new(Session)
	err := r.db.NewSelect().
		Model(session).
		Where("id = ?", id).
		Scan(ctx)
	if err != nil {
		return nil, err
	}
	return session, nil
}

// Create inserts a new session and populates server-generated fields via RETURNING *.
func (r *Repository) Create(ctx context.Context, session *Session) error {
	return r.db.NewInsert().
		Model(session).
		Returning("*").
		Scan(ctx)
}

// Update persists changes to an existing session, setting updated_at to NOW().
func (r *Repository) Update(ctx context.Context, session *Session) error {
	return r.db.NewUpdate().
		Model(session).
		WherePK().
		ExcludeColumn("id", "created_at", "updated_at").
		Set("updated_at = NOW()").
		Returning("*").
		Scan(ctx)
}

// Delete removes a session by ID and returns the number of affected rows.
func (r *Repository) Delete(ctx context.Context, id uuid.UUID) (int64, error) {
	res, err := r.db.NewDelete().
		Model((*Session)(nil)).
		Where("id = ?", id).
		Exec(ctx)
	if err != nil {
		return 0, err
	}
	n, err := res.RowsAffected()
	return n, err
}
