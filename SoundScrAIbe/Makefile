.PHONY: dev-backend dev-frontend build test docker-up docker-down migrate-up migrate-down migrate-create lint

# Run Go backend with hot reload (requires: go install github.com/air-verse/air@latest)
dev-backend:
	cd backend && air

# Run React dev server
dev-frontend:
	cd frontend && npm run dev

# Build both
build:
	cd backend && go build -o ../bin/soundscraibe ./cmd/server
	cd frontend && npm run build

# Run tests (no -race flag — CGO is disabled on Windows Git Bash)
test:
	cd backend && go test -v ./...
	cd frontend && npm test

# Docker
docker-up:
	docker compose up -d

docker-down:
	docker compose down

# Database migrations (requires: go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest)
migrate-up:
	migrate -path backend/migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path backend/migrations -database "$(DATABASE_URL)" down 1

migrate-create:
	migrate create -ext sql -dir backend/migrations -seq $(name)

# Lint
lint:
	cd backend && go vet ./...
	cd frontend && npm run lint
