package main

import (
	"context"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/uptrace/bun/migrate"

	"practice-journai/internal/database"
	"practice-journai/internal/database/migrations"
	"practice-journai/internal/server"
)

func main() {
	// Load .env file if present; ignore error so we can run without one.
	_ = godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	ctx := context.Background()

	db, err := database.Connect(ctx, databaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	log.Printf("Connected to database successfully")

	// Run migrations
	migrator := migrate.NewMigrator(db, migrations.Migrations)
	if err := migrator.Init(ctx); err != nil {
		log.Fatalf("Failed to init migrator: %v", err)
	}
	group, err := migrator.Migrate(ctx)
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	if group.IsZero() {
		log.Printf("No new migrations to run")
	} else {
		log.Printf("Migrated to %s", group)
	}

	router := server.New(db)

	log.Printf("Starting server on :%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
