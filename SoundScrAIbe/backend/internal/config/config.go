package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                string
	DatabaseURL         string
	Environment         string
	SpotifyClientID     string
	SpotifyClientSecret string
	SpotifyRedirectURI  string
	SessionSecret       string
	GroqAPIKey          string
}

func Load() *Config {
	// Try .env in current dir first, then parent (repo root) for when running from backend/
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")

	return &Config{
		Port:                getEnv("PORT", "8080"),
		DatabaseURL:         getEnv("DATABASE_URL", "postgres://soundscraibe:soundscraibe@localhost:5433/soundscraibe?sslmode=disable"),
		Environment:         getEnv("ENVIRONMENT", "development"),
		SpotifyClientID:     getEnv("SPOTIFY_CLIENT_ID", ""),
		SpotifyClientSecret: getEnv("SPOTIFY_CLIENT_SECRET", ""),
		SpotifyRedirectURI:  getEnv("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:5173/callback"),
		SessionSecret:       getEnv("SESSION_SECRET", "change-me-in-production"),
		GroqAPIKey:          getEnv("GROQ_API_KEY", ""),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
