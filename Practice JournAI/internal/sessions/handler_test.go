package sessions

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

// setupTestDB opens a database connection, ensures the sessions table exists,
// and registers a cleanup that truncates the table after the test.
func setupTestDB(t *testing.T) *bun.DB {
	t.Helper()
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set, skipping integration tests")
	}

	sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(databaseURL)))
	db := bun.NewDB(sqldb, pgdialect.New())

	// Ensure the sessions table exists for testing.
	_, err := db.ExecContext(
		t.Context(),
		`CREATE TABLE IF NOT EXISTS sessions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			due_date DATE NOT NULL,
			description TEXT NOT NULL,
			notes TEXT
		)`,
	)
	if err != nil {
		t.Fatalf("failed to create sessions table: %v", err)
	}

	// Truncate before test to ensure clean state.
	_, _ = db.NewDelete().Model((*Session)(nil)).Where("1=1").Exec(context.Background())

	t.Cleanup(func() {
		_, _ = db.NewDelete().Model((*Session)(nil)).Where("1=1").Exec(context.Background())
		db.Close()
	})

	return db
}

// newTestHandler creates a fully wired Handler backed by a real database.
func newTestHandler(t *testing.T) *Handler {
	t.Helper()
	db := setupTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	return NewHandler(svc)
}

// createSessionViaHandler is a helper that POSTs a session and returns its ID.
func createSessionViaHandler(t *testing.T, handler *Handler) string {
	t.Helper()
	body := `{"due_date":"2026-03-15","description":"Test session"}`
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/sessions", bytes.NewBufferString(body))
	ctx.Request.Header.Set("Content-Type", "application/json")

	handler.Create(ctx)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("setup: expected 201, got %d: %s", recorder.Code, recorder.Body.String())
	}

	var resp SessionResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &resp); err != nil {
		t.Fatalf("setup: failed to unmarshal response: %v", err)
	}
	return resp.ID
}

func TestCreateSession(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := newTestHandler(t)

	notes := "some notes"

	tests := []struct {
		name           string
		body           string
		expectedStatus int
		checkResponse  func(t *testing.T, body []byte)
	}{
		{
			name:           "valid request",
			body:           `{"due_date":"2026-03-15","description":"Practice scales","notes":"C major"}`,
			expectedStatus: http.StatusCreated,
			checkResponse: func(t *testing.T, body []byte) {
				var resp SessionResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if resp.ID == "" {
					t.Error("expected non-empty ID")
				}
				if resp.DueDate != "2026-03-15" {
					t.Errorf("expected due_date 2026-03-15, got %s", resp.DueDate)
				}
				if resp.Description != "Practice scales" {
					t.Errorf("expected description 'Practice scales', got %s", resp.Description)
				}
				if resp.Notes == nil || *resp.Notes != "C major" {
					t.Errorf("expected notes 'C major', got %v", resp.Notes)
				}
			},
		},
		{
			name:           "valid request with null notes",
			body:           `{"due_date":"2026-03-15","description":"No notes session"}`,
			expectedStatus: http.StatusCreated,
			checkResponse: func(t *testing.T, body []byte) {
				var resp SessionResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if resp.Notes != nil {
					t.Errorf("expected nil notes, got %v", resp.Notes)
				}
			},
		},
		{
			name:           "valid request with explicit notes pointer",
			body:           mustMarshal(CreateSessionRequest{DueDate: "2026-04-01", Description: "With notes", Notes: &notes}),
			expectedStatus: http.StatusCreated,
		},
		{
			name:           "missing description",
			body:           `{"due_date":"2026-03-15"}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "missing due_date",
			body:           `{"description":"Practice scales"}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "invalid date format",
			body:           `{"due_date":"15-03-2026","description":"Practice scales"}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "empty body",
			body:           `{}`,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/sessions", bytes.NewBufferString(tt.body))
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

func TestListSessions(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := newTestHandler(t)

	tests := []struct {
		name           string
		setup          func(t *testing.T)
		expectedStatus int
		checkResponse  func(t *testing.T, body []byte)
	}{
		{
			name:           "empty list",
			setup:          func(t *testing.T) {},
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var resp []SessionResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if len(resp) != 0 {
					t.Errorf("expected empty list, got %d items", len(resp))
				}
			},
		},
		{
			name: "returns created sessions",
			setup: func(t *testing.T) {
				createSessionViaHandler(t, handler)
				createSessionViaHandler(t, handler)
			},
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var resp []SessionResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if len(resp) != 2 {
					t.Errorf("expected 2 sessions, got %d", len(resp))
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setup(t)

			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodGet, "/api/v1/sessions", nil)

			handler.List(ctx)

			if recorder.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, recorder.Code)
			}

			if tt.checkResponse != nil {
				tt.checkResponse(t, recorder.Body.Bytes())
			}
		})
	}
}

func TestGetByID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := newTestHandler(t)

	// Create a session to use in the "valid ID" test case.
	existingID := createSessionViaHandler(t, handler)

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
				var resp SessionResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if resp.ID != existingID {
					t.Errorf("expected ID %s, got %s", existingID, resp.ID)
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
			ctx.Request = httptest.NewRequest(http.MethodGet, "/api/v1/sessions/"+tt.id, nil)
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

func TestUpdateSession(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := newTestHandler(t)

	existingID := createSessionViaHandler(t, handler)

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
			body:           `{"due_date":"2026-04-01","description":"Updated description"}`,
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var resp SessionResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if resp.Description != "Updated description" {
					t.Errorf("expected 'Updated description', got %s", resp.Description)
				}
				if resp.DueDate != "2026-04-01" {
					t.Errorf("expected due_date 2026-04-01, got %s", resp.DueDate)
				}
			},
		},
		{
			name:           "non-existent UUID",
			id:             "00000000-0000-0000-0000-000000000000",
			body:           `{"due_date":"2026-04-01","description":"Updated"}`,
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "invalid UUID",
			id:             "bad-id",
			body:           `{"due_date":"2026-04-01","description":"Updated"}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "missing required fields",
			id:             existingID,
			body:           `{"due_date":"2026-04-01"}`,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodPut, "/api/v1/sessions/"+tt.id, bytes.NewBufferString(tt.body))
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

func TestDeleteSession(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := newTestHandler(t)

	existingID := createSessionViaHandler(t, handler)

	tests := []struct {
		name           string
		id             string
		expectedStatus int
	}{
		{
			name:           "existing session",
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
			ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/v1/sessions/"+tt.id, nil)
			ctx.Params = gin.Params{{Key: "id", Value: tt.id}}

			handler.Delete(ctx)

			if recorder.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d: %s", tt.expectedStatus, recorder.Code, recorder.Body.String())
			}
		})
	}
}

func mustMarshal(v interface{}) string {
	b, err := json.Marshal(v)
	if err != nil {
		panic(err)
	}
	return string(b)
}
