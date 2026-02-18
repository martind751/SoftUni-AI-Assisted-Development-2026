package user

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

type User struct {
	ID           int64
	SpotifyID    string
	DisplayName  string
	AvatarURL    string
	AccessToken  string
	RefreshToken string
	TokenExpiry  time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// Upsert creates or updates a user by spotify_id. Returns the user's ID.
func Upsert(ctx context.Context, db *sql.DB, u *User) (int64, error) {
	var id int64
	err := db.QueryRowContext(ctx, `
		INSERT INTO users (spotify_id, display_name, avatar_url, access_token, refresh_token, token_expiry)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (spotify_id) DO UPDATE SET
			display_name  = EXCLUDED.display_name,
			avatar_url    = EXCLUDED.avatar_url,
			access_token  = EXCLUDED.access_token,
			refresh_token = EXCLUDED.refresh_token,
			token_expiry  = EXCLUDED.token_expiry,
			updated_at    = now()
		RETURNING id`,
		u.SpotifyID, u.DisplayName, u.AvatarURL, u.AccessToken, u.RefreshToken, u.TokenExpiry,
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("upserting user: %w", err)
	}
	return id, nil
}

// GetByID retrieves a user by primary key.
func GetByID(ctx context.Context, db *sql.DB, id int64) (*User, error) {
	u := &User{}
	err := db.QueryRowContext(ctx, `
		SELECT id, spotify_id, display_name, avatar_url, access_token, refresh_token, token_expiry, created_at, updated_at
		FROM users WHERE id = $1`, id,
	).Scan(&u.ID, &u.SpotifyID, &u.DisplayName, &u.AvatarURL, &u.AccessToken, &u.RefreshToken, &u.TokenExpiry, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("getting user by id: %w", err)
	}
	return u, nil
}

// UpdateTokens updates just the OAuth tokens for a user.
func UpdateTokens(ctx context.Context, db *sql.DB, userID int64, accessToken, refreshToken string, expiry time.Time) error {
	_, err := db.ExecContext(ctx, `
		UPDATE users SET access_token = $1, refresh_token = $2, token_expiry = $3, updated_at = now()
		WHERE id = $4`,
		accessToken, refreshToken, expiry, userID,
	)
	if err != nil {
		return fmt.Errorf("updating tokens: %w", err)
	}
	return nil
}
