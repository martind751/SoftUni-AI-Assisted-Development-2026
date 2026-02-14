package health

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

// HealthResponse represents the JSON response for the health check endpoint.
type HealthResponse struct {
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
	Error     string `json:"error,omitempty"`
}

// Handler holds dependencies for health check endpoints.
type Handler struct {
	db *bun.DB
}

// NewHandler creates a new health check handler with the given database connection.
func NewHandler(db *bun.DB) *Handler {
	return &Handler{db: db}
}

// HealthCheck pings the database and returns the current health status.
// Returns 200 with status "ok" when the database is reachable, or 503 with
// status "error" when the database ping fails.
func (h *Handler) HealthCheck(c *gin.Context) {
	timestamp := time.Now().UTC().Format(time.RFC3339)

	if err := h.db.PingContext(c.Request.Context()); err != nil {
		c.JSON(http.StatusServiceUnavailable, HealthResponse{
			Status:    "error",
			Timestamp: timestamp,
			Error:     err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, HealthResponse{
		Status:    "ok",
		Timestamp: timestamp,
	})
}
