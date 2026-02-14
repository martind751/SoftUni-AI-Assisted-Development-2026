package migrations

import (
	"context"
	"fmt"

	"github.com/uptrace/bun"
)

func init() {
	Migrations.MustRegister(func(ctx context.Context, db *bun.DB) error {
		fmt.Println("adding musicbrainz fields to songs table...")
		_, err := db.ExecContext(ctx, `
			ALTER TABLE songs
				ADD COLUMN duration_seconds INT,
				ADD COLUMN album TEXT,
				ADD COLUMN release_year INT,
				ADD COLUMN musicbrainz_artist_id TEXT
		`)
		return err
	}, func(ctx context.Context, db *bun.DB) error {
		fmt.Println("removing musicbrainz fields from songs table...")
		_, err := db.ExecContext(ctx, `
			ALTER TABLE songs
				DROP COLUMN IF EXISTS duration_seconds,
				DROP COLUMN IF EXISTS album,
				DROP COLUMN IF EXISTS release_year,
				DROP COLUMN IF EXISTS musicbrainz_artist_id
		`)
		return err
	})
}
