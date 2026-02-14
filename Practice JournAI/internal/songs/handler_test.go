package songs

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
)

func setupTestDB(t *testing.T) *bun.DB {
	t.Helper()
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set, skipping integration tests")
	}

	sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(databaseURL)))
	db := bun.NewDB(sqldb, pgdialect.New())

	// Drop and recreate table to match latest schema.
	_, _ = db.ExecContext(t.Context(), `DROP TABLE IF EXISTS songs`)

	_, err := db.ExecContext(t.Context(), `
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
		t.Fatalf("failed to create songs table: %v", err)
	}

	t.Cleanup(func() {
		_, _ = db.ExecContext(context.Background(), `DROP TABLE IF EXISTS songs`)
		db.Close()
	})

	return db
}

func newTestHandler(t *testing.T) *Handler {
	t.Helper()
	db := setupTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	return NewHandler(svc)
}

func createSongViaHandler(t *testing.T, handler *Handler, genre string) string {
	t.Helper()
	if genre == "" {
		genre = "jazz"
	}
	body := `{"title":"Test Song","artist":"Test Artist","genre":"` + genre + `"}`
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/songs", bytes.NewBufferString(body))
	ctx.Request.Header.Set("Content-Type", "application/json")

	handler.Create(ctx)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("setup: expected 201, got %d: %s", recorder.Code, recorder.Body.String())
	}

	var resp SongResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &resp); err != nil {
		t.Fatalf("setup: failed to unmarshal response: %v", err)
	}
	return resp.ID
}

func TestCreateSong(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := newTestHandler(t)

	tests := []struct {
		name           string
		body           string
		expectedStatus int
		checkResponse  func(t *testing.T, body []byte)
	}{
		{
			name:           "valid request",
			body:           `{"title":"Autumn Leaves","artist":"Bill Evans","genre":"jazz"}`,
			expectedStatus: http.StatusCreated,
			checkResponse: func(t *testing.T, body []byte) {
				var resp SongResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if resp.ID == "" {
					t.Error("expected non-empty ID")
				}
				if resp.Title != "Autumn Leaves" {
					t.Errorf("expected title Autumn Leaves, got %s", resp.Title)
				}
				if resp.Artist != "Bill Evans" {
					t.Errorf("expected artist Bill Evans, got %s", resp.Artist)
				}
				if resp.Genre != "jazz" {
					t.Errorf("expected genre jazz, got %s", resp.Genre)
				}
			},
		},
		{
			name:           "missing title",
			body:           `{"artist":"Bill Evans","genre":"jazz"}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "missing artist",
			body:           `{"title":"Autumn Leaves","genre":"jazz"}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "missing genre",
			body:           `{"title":"Autumn Leaves","artist":"Bill Evans"}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "invalid genre",
			body:           `{"title":"Autumn Leaves","artist":"Bill Evans","genre":"classical"}`,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/songs", bytes.NewBufferString(tt.body))
			ctx.Request.Header.Set("Content-Type", "application/json")

			handler.Create(ctx)

			if recorder.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d: %s", tt.expectedStatus, recorder.Code, recorder.Body.String())
			}

			if tt.checkResponse != nil {
				tt.checkResponse(t, recorder.Body.Bytes())
			}
		})
	}
}

func TestListSongs(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := newTestHandler(t)

	tests := []struct {
		name           string
		setup          func(t *testing.T)
		queryString    string
		expectedStatus int
		checkResponse  func(t *testing.T, body []byte)
	}{
		{
			name:           "empty list",
			setup:          func(t *testing.T) {},
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var resp []SongResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if len(resp) != 0 {
					t.Errorf("expected empty list, got %d items", len(resp))
				}
			},
		},
		{
			name: "filter by genre",
			setup: func(t *testing.T) {
				createSongViaHandler(t, handler, "jazz")
				createSongViaHandler(t, handler, "blues")
				createSongViaHandler(t, handler, "rock_metal")
			},
			queryString:    "?genre=jazz",
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var resp []SongResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if len(resp) != 1 {
					t.Errorf("expected 1 jazz song, got %d", len(resp))
				}
				if len(resp) > 0 && resp[0].Genre != "jazz" {
					t.Errorf("expected genre jazz, got %s", resp[0].Genre)
				}
			},
		},
		{
			name:           "invalid genre filter",
			setup:          func(t *testing.T) {},
			queryString:    "?genre=classical",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setup(t)

			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodGet, "/api/v1/songs"+tt.queryString, nil)

			handler.List(ctx)

			if recorder.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d: %s", tt.expectedStatus, recorder.Code, recorder.Body.String())
			}

			if tt.checkResponse != nil {
				tt.checkResponse(t, recorder.Body.Bytes())
			}
		})
	}
}

func TestGetSongByID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := newTestHandler(t)

	existingID := createSongViaHandler(t, handler, "jazz")

	tests := []struct {
		name           string
		id             string
		expectedStatus int
		checkResponse  func(t *testing.T, body []byte)
	}{
		{
			name:           "valid ID",
			id:             existingID,
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var resp SongResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if resp.ID != existingID {
					t.Errorf("expected ID %s, got %s", existingID, resp.ID)
				}
				if resp.Genre != "jazz" {
					t.Errorf("expected genre jazz, got %s", resp.Genre)
				}
			},
		},
		{
			name:           "non-existent UUID",
			id:             "00000000-0000-0000-0000-000000000000",
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "invalid UUID",
			id:             "not-a-uuid",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodGet, "/api/v1/songs/"+tt.id, nil)
			ctx.Params = gin.Params{{Key: "id", Value: tt.id}}

			handler.GetByID(ctx)

			if recorder.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d: %s", tt.expectedStatus, recorder.Code, recorder.Body.String())
			}

			if tt.checkResponse != nil {
				tt.checkResponse(t, recorder.Body.Bytes())
			}
		})
	}
}

func TestUpdateSong(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := newTestHandler(t)

	existingID := createSongViaHandler(t, handler, "jazz")

	tests := []struct {
		name           string
		id             string
		body           string
		expectedStatus int
		checkResponse  func(t *testing.T, body []byte)
	}{
		{
			name:           "valid update",
			id:             existingID,
			body:           `{"title":"Blue in Green","artist":"Miles Davis","genre":"blues"}`,
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var resp SongResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if resp.Title != "Blue in Green" {
					t.Errorf("expected title 'Blue in Green', got %s", resp.Title)
				}
				if resp.Artist != "Miles Davis" {
					t.Errorf("expected artist 'Miles Davis', got %s", resp.Artist)
				}
				if resp.Genre != "blues" {
					t.Errorf("expected genre blues, got %s", resp.Genre)
				}
			},
		},
		{
			name:           "non-existent UUID",
			id:             "00000000-0000-0000-0000-000000000000",
			body:           `{"title":"Blue in Green","artist":"Miles Davis","genre":"jazz"}`,
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodPut, "/api/v1/songs/"+tt.id, bytes.NewBufferString(tt.body))
			ctx.Request.Header.Set("Content-Type", "application/json")
			ctx.Params = gin.Params{{Key: "id", Value: tt.id}}

			handler.Update(ctx)

			if recorder.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d: %s", tt.expectedStatus, recorder.Code, recorder.Body.String())
			}

			if tt.checkResponse != nil {
				tt.checkResponse(t, recorder.Body.Bytes())
			}
		})
	}
}

func TestDeleteSong(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := newTestHandler(t)

	existingID := createSongViaHandler(t, handler, "jazz")

	tests := []struct {
		name           string
		id             string
		expectedStatus int
	}{
		{
			name:           "existing song",
			id:             existingID,
			expectedStatus: http.StatusNoContent,
		},
		{
			name:           "non-existent UUID",
			id:             "00000000-0000-0000-0000-000000000000",
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "invalid UUID",
			id:             "not-valid",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/v1/songs/"+tt.id, nil)
			ctx.Params = gin.Params{{Key: "id", Value: tt.id}}

			handler.Delete(ctx)

			if recorder.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d: %s", tt.expectedStatus, recorder.Code, recorder.Body.String())
			}
		})
	}
}
