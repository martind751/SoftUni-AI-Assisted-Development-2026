package session

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"time"
)

const sessionDuration = 7 * 24 * time.Hour // 7 days

type Session struct {
	Token     string
	UserID    int64
	ExpiresAt time.Time
	CreatedAt time.Time
}

// Create generates a new session for the given user and stores it in the database.
func Create(ctx context.Context, db *sql.DB, userID int64) (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("generating session token: %w", err)
	}
	token := hex.EncodeToString(bytes)
	expiresAt := time.Now().Add(sessionDuration)

	_, err := db.ExecContext(ctx, `
		INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
		token, userID, expiresAt,
	)
	if err != nil {
		return "", fmt.Errorf("creating session: %w", err)
	}

	return token, nil
}

// GetByToken retrieves a valid (non-expired) session by its token.
func GetByToken(ctx context.Context, db *sql.DB, token string) (*Session, error) {
	s := &Session{}
	err := db.QueryRowContext(ctx, `
		SELECT token, user_id, expires_at, created_at
		FROM sessions WHERE token = $1 AND expires_at > now()`, token,
	).Scan(&s.Token, &s.UserID, &s.ExpiresAt, &s.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("getting session: %w", err)
	}
	return s, nil
}

// Delete removes a session by its token (for logout).
func Delete(ctx context.Context, db *sql.DB, token string) error {
	_, err := db.ExecContext(ctx, `DELETE FROM sessions WHERE token = $1`, token)
	if err != nil {
		return fmt.Errorf("deleting session: %w", err)
	}
	return nil
}
