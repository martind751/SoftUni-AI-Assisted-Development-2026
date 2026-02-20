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
			protected.GET("/artist-charts", h.ArtistCharts)
			protected.GET("/tracks/:id", h.TrackDetail)
			protected.GET("/albums/:id", h.AlbumDetail)
			protected.GET("/artists/:id", h.ArtistDetail)

			protected.GET("/ratings/:entityType/:entityId", h.GetRating)
			protected.PUT("/ratings/:entityType/:entityId", h.SetRating)
			protected.DELETE("/ratings/:entityType/:entityId", h.DeleteRating)

			protected.GET("/shelves/:entityType/:entityId", h.GetShelf)
			protected.PUT("/shelves/:entityType/:entityId", h.SetShelf)
			protected.DELETE("/shelves/:entityType/:entityId", h.DeleteShelf)

			protected.GET("/tags/:entityType/:entityId", h.GetTags)
			protected.PUT("/tags/:entityType/:entityId", h.SetTags)
			protected.GET("/tags", h.GetUserTags)

			protected.GET("/search", h.Search)
			protected.GET("/library/summary", h.LibrarySummary)
			protected.GET("/library/favorites", h.GetFavorites)
			protected.GET("/library", h.Library)

			protected.GET("/stats/overview", h.StatsOverview)
			protected.GET("/stats/spotify-top", h.SpotifyTop)
			protected.GET("/stats/my-top", h.MyTop)
			protected.GET("/stats/clock", h.StatsClock)

			recommendations := protected.Group("/recommendations")
			{
				recommendations.POST("/smart", h.SmartRecommend)
				recommendations.POST("/prompt", h.PromptRecommend)
				recommendations.GET("/history", h.RecommendationHistory)
				recommendations.GET("/history/:id", h.RecommendationDetail)
			}
		}
	}

	return r
}
