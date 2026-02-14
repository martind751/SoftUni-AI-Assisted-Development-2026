package health

import (
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

func TestHealthCheck(t *testing.T) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set, skipping health check tests")
	}

	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		setupDB        func(t *testing.T) *bun.DB
		expectedStatus int
		expectedBody   string
	}{
		{
			name: "healthy database",
			setupDB: func(t *testing.T) *bun.DB {
				t.Helper()
				sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(databaseURL)))
				return bun.NewDB(sqldb, pgdialect.New())
			},
			expectedStatus: http.StatusOK,
			expectedBody:   "ok",
		},
		{
			name: "unhealthy database",
			setupDB: func(t *testing.T) *bun.DB {
				t.Helper()
				sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(databaseURL)))
				db := bun.NewDB(sqldb, pgdialect.New())
				// Close the underlying sql.DB so the ping will fail.
				sqldb.Close()
				return db
			},
			expectedStatus: http.StatusServiceUnavailable,
			expectedBody:   "error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := tt.setupDB(t)
			defer db.Close()

			handler := NewHandler(db)

			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)

			handler.HealthCheck(ctx)

			if recorder.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, recorder.Code)
			}

			var response HealthResponse
			if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
				t.Fatalf("failed to unmarshal response: %v", err)
			}

			if response.Status != tt.expectedBody {
				t.Errorf("expected status %q, got %q", tt.expectedBody, response.Status)
			}

			if response.Timestamp == "" {
				t.Error("expected non-empty timestamp")
			}

			if tt.expectedBody == "error" && response.Error == "" {
				t.Error("expected non-empty error message for unhealthy status")
			}

			if tt.expectedBody == "ok" && response.Error != "" {
				t.Errorf("expected empty error for healthy status, got %q", response.Error)
			}
		})
	}
}
