package server

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

type handlers struct {
	db *sql.DB
}

func New(db *sql.DB) *gin.Engine {
	r := gin.Default()

	h := &handlers{db: db}

	api := r.Group("/api")
	{
		api.GET("/health", h.HealthCheck)
	}

	return r
}
