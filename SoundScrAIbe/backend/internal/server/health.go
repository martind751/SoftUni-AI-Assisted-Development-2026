package server

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func (h *handlers) HealthCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	status := "healthy"
	dbStatus := "connected"
	httpStatus := http.StatusOK

	if err := h.db.PingContext(ctx); err != nil {
		status = "unhealthy"
		dbStatus = "disconnected"
		httpStatus = http.StatusServiceUnavailable
	}

	c.JSON(httpStatus, gin.H{
		"status":   status,
		"service":  "SoundScrAIbe",
		"database": dbStatus,
	})
}
