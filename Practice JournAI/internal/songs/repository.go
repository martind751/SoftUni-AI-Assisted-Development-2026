package songs

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

var allowedOrderColumns = map[string]string{
	"title":      "so.title",
	"artist":     "so.artist",
	"created_at": "so.created_at",
}

type ListFilters struct {
	Genre    *Genre
	OrderBy  string
	OrderDir string
}

type Repository struct {
	db *bun.DB
}

func NewRepository(db *bun.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(ctx context.Context, filters ListFilters) ([]Song, error) {
	var songs []Song
	q := r.db.NewSelect().
		Model(&songs)

	if filters.Genre != nil {
		q = q.Where("so.genre = ?", *filters.Genre)
	}

	col := "so.title"
	if c, ok := allowedOrderColumns[filters.OrderBy]; ok {
		col = c
	}
	dir := "ASC"
	if filters.OrderDir == "desc" {
		dir = "DESC"
	}
	q = q.OrderExpr(fmt.Sprintf("%s %s", col, dir))

	err := q.Scan(ctx)
	if err != nil {
		return nil, err
	}
	return songs, nil
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Song, error) {
	song := new(Song)
	err := r.db.NewSelect().
		Model(song).
		Where("so.id = ?", id).
		Scan(ctx)
	if err != nil {
		return nil, err
	}
	return song, nil
}

func (r *Repository) Create(ctx context.Context, song *Song) error {
	return r.db.NewInsert().
		Model(song).
		Returning("*").
		Scan(ctx)
}

func (r *Repository) Update(ctx context.Context, song *Song) error {
	return r.db.NewUpdate().
		Model(song).
		WherePK().
		ExcludeColumn("id", "created_at", "updated_at").
		Set("updated_at = NOW()").
		Returning("*").
		Scan(ctx)
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) (int64, error) {
	res, err := r.db.NewDelete().
		Model((*Song)(nil)).
		Where("id = ?", id).
		Exec(ctx)
	if err != nil {
		return 0, err
	}
	n, err := res.RowsAffected()
	return n, err
}
