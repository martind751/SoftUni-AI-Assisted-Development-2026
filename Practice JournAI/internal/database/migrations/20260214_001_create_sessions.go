package migrations

import (
	"context"
	"fmt"

	"github.com/uptrace/bun"
)

func init() {
	Migrations.MustRegister(func(ctx context.Context, db *bun.DB) error {
		fmt.Println("creating sessions table...")
		_, err := db.ExecContext(ctx, `
			CREATE TABLE IF NOT EXISTS sessions (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				due_date DATE NOT NULL,
				description TEXT NOT NULL,
				notes TEXT
			)
		`)
		return err
	}, func(ctx context.Context, db *bun.DB) error {
		fmt.Println("dropping sessions table...")
		_, err := db.ExecContext(ctx, `DROP TABLE IF EXISTS sessions`)
		return err
	})
}
