package main

import (
	"log"

	"soundscraibe/internal/config"
	"soundscraibe/internal/database"
	"soundscraibe/internal/server"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	srv := server.New(db, cfg)
	log.Printf("SoundScrAIbe server starting on :%s", cfg.Port)
	if err := srv.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
