package migrations

import (
	"context"
	"fmt"

	"github.com/uptrace/bun"
)

func init() {
	Migrations.MustRegister(func(ctx context.Context, db *bun.DB) error {
		fmt.Println("creating songs table...")
		_, err := db.ExecContext(ctx, `
			CREATE TABLE IF NOT EXISTS songs (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				title TEXT NOT NULL,
				artist TEXT NOT NULL,
				genre VARCHAR(20) NOT NULL CHECK (genre IN ('jazz', 'blues', 'rock_metal')),
				notes TEXT
			)
		`)
		if err != nil {
			return err
		}
		_, err = db.ExecContext(ctx, `CREATE INDEX idx_songs_genre ON songs(genre)`)
		return err
	}, func(ctx context.Context, db *bun.DB) error {
		fmt.Println("dropping songs table...")
		_, err := db.ExecContext(ctx, `DROP INDEX IF EXISTS idx_songs_genre`)
		if err != nil {
			return err
		}
		_, err = db.ExecContext(ctx, `DROP TABLE IF EXISTS songs`)
		return err
	})
}
