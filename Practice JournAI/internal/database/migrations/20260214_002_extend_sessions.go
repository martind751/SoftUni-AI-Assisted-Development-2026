package migrations

import (
	"context"
	"fmt"

	"github.com/uptrace/bun"
)

func init() {
	Migrations.MustRegister(func(ctx context.Context, db *bun.DB) error {
		fmt.Println("extending sessions table and creating session_notes...")
		_, err := db.ExecContext(ctx, `
			ALTER TABLE sessions
				ADD COLUMN duration_minutes INTEGER,
				ADD COLUMN energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
				ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'planned'
					CHECK (status IN ('planned', 'completed', 'skipped')),
				ADD COLUMN genre VARCHAR(20) NOT NULL DEFAULT 'jazz'
					CHECK (genre IN ('jazz', 'blues', 'rock_metal')),
				DROP COLUMN notes
		`)
		if err != nil {
			return err
		}

		_, err = db.ExecContext(ctx, `
			CREATE TABLE IF NOT EXISTS session_notes (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
				content TEXT NOT NULL,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)
		`)
		if err != nil {
			return err
		}

		_, err = db.ExecContext(ctx, `CREATE INDEX idx_session_notes_session_id ON session_notes(session_id)`)
		if err != nil {
			return err
		}

		_, err = db.ExecContext(ctx, `CREATE INDEX idx_sessions_genre_status ON sessions(genre, status)`)
		return err
	}, func(ctx context.Context, db *bun.DB) error {
		fmt.Println("reverting sessions extension...")
		_, err := db.ExecContext(ctx, `DROP TABLE IF EXISTS session_notes`)
		if err != nil {
			return err
		}
		_, err = db.ExecContext(ctx, `DROP INDEX IF EXISTS idx_sessions_genre_status`)
		if err != nil {
			return err
		}
		_, err = db.ExecContext(ctx, `
			ALTER TABLE sessions
				DROP COLUMN IF EXISTS duration_minutes,
				DROP COLUMN IF EXISTS energy_level,
				DROP COLUMN IF EXISTS status,
				DROP COLUMN IF EXISTS genre,
				ADD COLUMN notes TEXT
		`)
		return err
	})
}
