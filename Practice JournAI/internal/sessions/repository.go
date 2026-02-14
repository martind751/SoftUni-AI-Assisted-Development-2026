package sessions

import (
	"context"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type ListFilters struct {
	Genre  *Genre
	Status *SessionStatus
}

type Repository struct {
	db *bun.DB
}

func NewRepository(db *bun.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(ctx context.Context, filters ListFilters) ([]Session, error) {
	var sessions []Session
	q := r.db.NewSelect().
		Model(&sessions).
		Relation("Notes", func(q *bun.SelectQuery) *bun.SelectQuery {
			return q.OrderExpr("sn.created_at ASC")
		}).
		OrderExpr("s.due_date ASC")

	if filters.Genre != nil {
		q = q.Where("s.genre = ?", *filters.Genre)
	}
	if filters.Status != nil {
		q = q.Where("s.status = ?", *filters.Status)
	}

	err := q.Scan(ctx)
	if err != nil {
		return nil, err
	}
	return sessions, nil
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Session, error) {
	session := new(Session)
	err := r.db.NewSelect().
		Model(session).
		Relation("Notes", func(q *bun.SelectQuery) *bun.SelectQuery {
			return q.OrderExpr("sn.created_at ASC")
		}).
		Where("s.id = ?", id).
		Scan(ctx)
	if err != nil {
		return nil, err
	}
	return session, nil
}

func (r *Repository) Create(ctx context.Context, session *Session) error {
	return r.db.NewInsert().
		Model(session).
		Returning("*").
		Scan(ctx)
}

func (r *Repository) Update(ctx context.Context, session *Session) error {
	return r.db.NewUpdate().
		Model(session).
		WherePK().
		ExcludeColumn("id", "created_at", "updated_at").
		Set("updated_at = NOW()").
		Returning("*").
		Scan(ctx)
}

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

func (r *Repository) CreateNote(ctx context.Context, note *SessionNote) error {
	return r.db.NewInsert().
		Model(note).
		Returning("*").
		Scan(ctx)
}

func (r *Repository) DeleteNote(ctx context.Context, noteID uuid.UUID) (int64, error) {
	res, err := r.db.NewDelete().
		Model((*SessionNote)(nil)).
		Where("id = ?", noteID).
		Exec(ctx)
	if err != nil {
		return 0, err
	}
	n, err := res.RowsAffected()
	return n, err
}
