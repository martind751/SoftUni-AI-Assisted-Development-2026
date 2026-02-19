package server

import (
	"database/sql"

	"soundscraibe/internal/config"
	"soundscraibe/internal/spotify"

	"github.com/gin-gonic/gin"
)

type handlers struct {
	db      *sql.DB
	cfg     *config.Config
	spotify *spotify.Config
}

func New(db *sql.DB, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	h := &handlers{
		db:  db,
		cfg: cfg,
		spotify: &spotify.Config{
			ClientID:     cfg.SpotifyClientID,
			ClientSecret: cfg.SpotifyClientSecret,
			RedirectURI:  cfg.SpotifyRedirectURI,
		},
	}

	api := r.Group("/api")
	{
		api.GET("/health", h.HealthCheck)

		auth := api.Group("/auth")
		{
			auth.GET("/spotify", h.SpotifyAuthConfig)
			auth.POST("/callback", h.SpotifyCallback)
			auth.POST("/logout", h.Logout)
		}

		protected := api.Group("")
		protected.Use(h.AuthRequired())
		{
			protected.GET("/me", h.Me)
			protected.GET("/recently-played", h.RecentlyPlayed)
			protected.GET("/liked-songs/check", h.CheckLikedSongs)
			protected.PUT("/liked-songs/:trackId", h.SaveLikedSong)
			protected.DELETE("/liked-songs/:trackId", h.RemoveLikedSong)
		}
	}

	return r
}
