package server

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"

	"practice-journai/internal/health"
)

// New creates and configures a Gin engine with CORS, route groups, and all
// registered handlers.
func New(db *bun.DB) *gin.Engine {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	healthHandler := health.NewHandler(db)

	v1 := router.Group("/api/v1")
	{
		v1.GET("/health", healthHandler.HealthCheck)
	}

	return router
}
