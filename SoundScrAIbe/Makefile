.PHONY: dev-backend dev-frontend build test docker-up docker-down migrate lint

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

# Placeholder for golang-migrate
migrate:
	@echo "Migration tooling not yet configured."

# Lint
lint:
	cd backend && go vet ./...
	cd frontend && npm run lint
