# Practice JournAI - Backend Engineer Memory

## Project Structure
- **Go module**: `practice-journai`
- **Entry point**: `cmd/server/main.go`
- **Internal packages**: `internal/database`, `internal/health`, `internal/server`
- **Planned domains**: auth, tunes, sessions, genres, tempologs (each under `internal/`)

## Key File Paths
- `cmd/server/main.go` - Main entry point, loads .env, connects DB, starts Gin
- `internal/database/database.go` - `Connect(ctx, dsn)` returns `*bun.DB`
- `internal/server/server.go` - `New(db)` returns configured `*gin.Engine`
- `internal/health/handler.go` - Health check endpoint handler
- `docker-compose.yml` - PostgreSQL 18 on port 5432 (user: postgres, pass: postgres, db: practice_journai)

## Architecture Patterns
- Three-layer: handler -> service -> repository per domain package
- All routes under `/api/v1/` group
- CORS configured for `http://localhost:5173` (Vite frontend)
- Server port defaults to 8080, configurable via `SERVER_PORT` env var
- `DATABASE_URL` env var is required (fatal if missing)
- `.env` loading via godotenv (error ignored for flexibility)
- `bundebug` query hook enabled with verbose logging

## Testing Patterns
- Table-driven tests in same package (white-box)
- `gin.SetMode(gin.TestMode)` in test setup
- `httptest.NewRecorder` + `gin.CreateTestContext` for handler tests
- `t.Skip("DATABASE_URL not set")` guard for DB-dependent tests
- Unhealthy DB test: close underlying `sql.DB` before calling handler

## Database
- PostgreSQL 18 via Docker Compose
- Bun ORM with pgdialect
- DSN format: `postgres://postgres:postgres@localhost:5432/practice_journai?sslmode=disable`

## Dependencies (installed)
- gin, gin-contrib/cors
- bun, bun/dialect/pgdialect, bun/driver/pgdriver, bun/extra/bundebug
- joho/godotenv
