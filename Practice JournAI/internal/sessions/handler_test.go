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

func setupTestDB(t *testing.T) *bun.DB {
	t.Helper()
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set, skipping integration tests")
	}

	sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(databaseURL)))
	db := bun.NewDB(sqldb, pgdialect.New())

	// Drop and recreate tables to match latest schema.
	_, _ = db.ExecContext(t.Context(), `DROP TABLE IF EXISTS session_notes`)
	_, _ = db.ExecContext(t.Context(), `DROP TABLE IF EXISTS sessions`)

	_, err := db.ExecContext(t.Context(), `
		CREATE TABLE IF NOT EXISTS sessions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			due_date DATE NOT NULL,
			description TEXT NOT NULL,
			duration_minutes INTEGER,
			energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
			status VARCHAR(20) NOT NULL DEFAULT 'planned'
				CHECK (status IN ('planned', 'completed', 'skipped')),
			genre VARCHAR(20) NOT NULL DEFAULT 'jazz'
				CHECK (genre IN ('jazz', 'blues', 'rock_metal'))
		)
	`)
	if err != nil {
		t.Fatalf("failed to create sessions table: %v", err)
	}

	_, err = db.ExecContext(t.Context(), `
		CREATE TABLE IF NOT EXISTS session_notes (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
	if err != nil {
		t.Fatalf("failed to create session_notes table: %v", err)
	}

	t.Cleanup(func() {
		_, _ = db.ExecContext(context.Background(), `DROP TABLE IF EXISTS session_notes`)
		_, _ = db.ExecContext(context.Background(), `DROP TABLE IF EXISTS sessions`)
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

func createSessionViaHandler(t *testing.T, handler *Handler, genre string) string {
	t.Helper()
	if genre == "" {
		genre = "jazz"
	}
	body := `{"due_date":"2026-03-15","description":"Test session","genre":"` + genre + `"}`
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

	tests := []struct {
		name           string
		body           string
		expectedStatus int
		checkResponse  func(t *testing.T, body []byte)
	}{
		{
			name:           "valid request with genre",
			body:           `{"due_date":"2026-03-15","description":"Practice scales","genre":"jazz"}`,
			expectedStatus: http.StatusCreated,
			checkResponse: func(t *testing.T, body []byte) {
				var resp SessionResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if resp.ID == "" {
					t.Error("expected non-empty ID")
				}
				if resp.Genre != "jazz" {
					t.Errorf("expected genre jazz, got %s", resp.Genre)
				}
				if resp.Status != "planned" {
					t.Errorf("expected status planned, got %s", resp.Status)
				}
				if resp.Notes == nil || len(resp.Notes) != 0 {
					t.Errorf("expected empty notes slice, got %v", resp.Notes)
				}
			},
		},
		{
			name:           "valid request with all optional fields",
			body:           `{"due_date":"2026-03-15","description":"Full session","genre":"blues","status":"completed","duration_minutes":45,"energy_level":4}`,
			expectedStatus: http.StatusCreated,
			checkResponse: func(t *testing.T, body []byte) {
				var resp SessionResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if resp.Genre != "blues" {
					t.Errorf("expected genre blues, got %s", resp.Genre)
				}
				if resp.Status != "completed" {
					t.Errorf("expected status completed, got %s", resp.Status)
				}
				if resp.DurationMinutes == nil || *resp.DurationMinutes != 45 {
					t.Errorf("expected duration_minutes 45, got %v", resp.DurationMinutes)
				}
				if resp.EnergyLevel == nil || *resp.EnergyLevel != 4 {
					t.Errorf("expected energy_level 4, got %v", resp.EnergyLevel)
				}
			},
		},
		{
			name:           "missing genre",
			body:           `{"due_date":"2026-03-15","description":"No genre"}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "invalid genre",
			body:           `{"due_date":"2026-03-15","description":"Bad genre","genre":"classical"}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "invalid energy level too high",
			body:           `{"due_date":"2026-03-15","description":"High energy","genre":"jazz","energy_level":6}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "invalid energy level too low",
			body:           `{"due_date":"2026-03-15","description":"Low energy","genre":"jazz","energy_level":0}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "missing description",
			body:           `{"due_date":"2026-03-15","genre":"jazz"}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "invalid date format",
			body:           `{"due_date":"15-03-2026","description":"Practice","genre":"jazz"}`,
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
		queryString    string
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
			name: "filter by genre",
			setup: func(t *testing.T) {
				createSessionViaHandler(t, handler, "jazz")
				createSessionViaHandler(t, handler, "blues")
				createSessionViaHandler(t, handler, "rock_metal")
			},
			queryString:    "?genre=jazz",
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var resp []SessionResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if len(resp) != 1 {
					t.Errorf("expected 1 jazz session, got %d", len(resp))
				}
				if len(resp) > 0 && resp[0].Genre != "jazz" {
					t.Errorf("expected genre jazz, got %s", resp[0].Genre)
				}
			},
		},
		{
			name: "filter by status",
			setup: func(t *testing.T) {
				createSessionViaHandler(t, handler, "jazz")
			},
			queryString:    "?status=planned",
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var resp []SessionResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if len(resp) != 1 {
					t.Errorf("expected 1 planned session, got %d", len(resp))
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
			ctx.Request = httptest.NewRequest(http.MethodGet, "/api/v1/sessions"+tt.queryString, nil)

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

func TestGetByID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := newTestHandler(t)

	existingID := createSessionViaHandler(t, handler, "jazz")

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

	existingID := createSessionViaHandler(t, handler, "jazz")

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
			body:           `{"due_date":"2026-04-01","description":"Updated","genre":"blues","status":"completed","duration_minutes":30,"energy_level":3}`,
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var resp SessionResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if resp.Description != "Updated" {
					t.Errorf("expected 'Updated', got %s", resp.Description)
				}
				if resp.Genre != "blues" {
					t.Errorf("expected genre blues, got %s", resp.Genre)
				}
				if resp.Status != "completed" {
					t.Errorf("expected status completed, got %s", resp.Status)
				}
			},
		},
		{
			name:           "non-existent UUID",
			id:             "00000000-0000-0000-0000-000000000000",
			body:           `{"due_date":"2026-04-01","description":"Updated","genre":"jazz","status":"planned"}`,
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "missing status",
			id:             existingID,
			body:           `{"due_date":"2026-04-01","description":"Updated","genre":"jazz"}`,
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

	existingID := createSessionViaHandler(t, handler, "jazz")

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

func TestCreateNote(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := newTestHandler(t)

	sessionID := createSessionViaHandler(t, handler, "jazz")

	tests := []struct {
		name           string
		sessionID      string
		body           string
		expectedStatus int
		checkResponse  func(t *testing.T, body []byte)
	}{
		{
			name:           "valid note",
			sessionID:      sessionID,
			body:           `{"content":"Felt good about scales today"}`,
			expectedStatus: http.StatusCreated,
			checkResponse: func(t *testing.T, body []byte) {
				var resp SessionNoteResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("failed to unmarshal: %v", err)
				}
				if resp.ID == "" {
					t.Error("expected non-empty note ID")
				}
				if resp.Content != "Felt good about scales today" {
					t.Errorf("expected content match, got %s", resp.Content)
				}
			},
		},
		{
			name:           "missing content",
			sessionID:      sessionID,
			body:           `{}`,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "non-existent session",
			sessionID:      "00000000-0000-0000-0000-000000000000",
			body:           `{"content":"orphan note"}`,
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "invalid session ID",
			sessionID:      "bad-id",
			body:           `{"content":"test"}`,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/sessions/"+tt.sessionID+"/notes", bytes.NewBufferString(tt.body))
			ctx.Request.Header.Set("Content-Type", "application/json")
			ctx.Params = gin.Params{{Key: "id", Value: tt.sessionID}}

			handler.CreateNote(ctx)

			if recorder.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d: %s", tt.expectedStatus, recorder.Code, recorder.Body.String())
			}

			if tt.checkResponse != nil {
				tt.checkResponse(t, recorder.Body.Bytes())
			}
		})
	}
}

func TestDeleteNote(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := newTestHandler(t)

	sessionID := createSessionViaHandler(t, handler, "jazz")

	// Create a note to delete.
	noteBody := `{"content":"Note to delete"}`
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/sessions/"+sessionID+"/notes", bytes.NewBufferString(noteBody))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Params = gin.Params{{Key: "id", Value: sessionID}}
	handler.CreateNote(ctx)

	var noteResp SessionNoteResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &noteResp); err != nil {
		t.Fatalf("setup: failed to unmarshal note: %v", err)
	}

	tests := []struct {
		name           string
		sessionID      string
		noteID         string
		expectedStatus int
	}{
		{
			name:           "existing note",
			sessionID:      sessionID,
			noteID:         noteResp.ID,
			expectedStatus: http.StatusNoContent,
		},
		{
			name:           "non-existent note",
			sessionID:      sessionID,
			noteID:         "00000000-0000-0000-0000-000000000000",
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "invalid note ID",
			sessionID:      sessionID,
			noteID:         "bad-id",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodDelete, "/api/v1/sessions/"+tt.sessionID+"/notes/"+tt.noteID, nil)
			ctx.Params = gin.Params{
				{Key: "id", Value: tt.sessionID},
				{Key: "noteId", Value: tt.noteID},
			}

			handler.DeleteNote(ctx)

			if recorder.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d: %s", tt.expectedStatus, recorder.Code, recorder.Body.String())
			}
		})
	}
}

func TestNotesIncludedInSession(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := newTestHandler(t)

	sessionID := createSessionViaHandler(t, handler, "jazz")

	// Create two notes.
	for _, content := range []string{"First note", "Second note"} {
		body := `{"content":"` + content + `"}`
		rec := httptest.NewRecorder()
		ctx, _ := gin.CreateTestContext(rec)
		ctx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/sessions/"+sessionID+"/notes", bytes.NewBufferString(body))
		ctx.Request.Header.Set("Content-Type", "application/json")
		ctx.Params = gin.Params{{Key: "id", Value: sessionID}}
		handler.CreateNote(ctx)
		if rec.Code != http.StatusCreated {
			t.Fatalf("failed to create note: %d %s", rec.Code, rec.Body.String())
		}
	}

	// Fetch session and verify notes are included.
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/v1/sessions/"+sessionID, nil)
	ctx.Params = gin.Params{{Key: "id", Value: sessionID}}
	handler.GetByID(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}

	var resp SessionResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}
	if len(resp.Notes) != 2 {
		t.Errorf("expected 2 notes, got %d", len(resp.Notes))
	}
}
