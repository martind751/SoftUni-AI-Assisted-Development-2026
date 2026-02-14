.PHONY: dev dev-backend dev-frontend build test docker-up docker-down lint clean

# Start everything: Postgres + backend + frontend (Ctrl+C stops all)
dev:
	docker compose up -d
	@trap 'kill %1 2>/dev/null' EXIT; \
	go run ./cmd/server & \
	cd frontend && npm run dev

# Run Go backend only
dev-backend:
	go run ./cmd/server

# Run frontend dev server only
dev-frontend:
	cd frontend && npm run dev

# Build Go binary
build:
	go build -o bin/server ./cmd/server

# Run Go tests
test:
	go test -v ./...

# Start Docker services
docker-up:
	docker compose up -d

# Stop Docker services
docker-down:
	docker compose down

# Format and vet Go code
lint:
	go fmt ./...
	go vet ./...

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f coverage.out
