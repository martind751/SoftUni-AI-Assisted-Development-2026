# Practice JournAI

A personal web application for musicians to track practice sessions, manage repertoire, and visualize progress.

## Tech Stack

- **Backend:** Go 1.24, Gin, Bun ORM, PostgreSQL 18
- **Frontend:** Vite, React 19, TypeScript (strict), TanStack Router, TanStack Query, Zod, Tailwind CSS v4
- **Infrastructure:** Docker Compose (PostgreSQL)

## Module & Ports

- Go module: `practice-journai`
- Backend: `localhost:8080`
- Frontend dev: `localhost:5173`
- PostgreSQL: `localhost:5433` (mapped from container's 5432)
- API prefix: `/api/v1/`

## Backend Architecture

Three-layer pattern per domain package under `internal/`:

```
internal/{domain}/
  handler.go       — Gin handlers, request parsing, response writing
  service.go       — Business logic, validation, orchestration
  repository.go    — Database queries via Bun ORM
  models.go        — DB models + request/response structs
  handler_test.go  — Table-driven tests
```

Planned domains: auth, tunes, sessions, genres, tempologs.

## Frontend Architecture

Feature-based organization under `frontend/src/`:

```
features/{name}/
  components/   — Feature-specific React components
  hooks/        — TanStack Query hooks for data fetching
  schemas/      — Zod schemas for API responses
  types/        — TypeScript types derived from Zod schemas
```

Shared UI primitives in `frontend/src/components/ui/`.
Routes in `frontend/src/routes/` (TanStack Router file-based routing).

## Commands

```bash
docker compose up -d          # Start PostgreSQL
go run ./cmd/server            # Start backend
cd frontend && npm run dev     # Start frontend
go test -v ./...               # Run backend tests
```

## Conventions

- All API responses validated with Zod schemas on the frontend
- Types derived from Zod via `z.infer<typeof schema>` — never duplicate manually
- CORS allows `http://localhost:5173`
- Environment config via `.env` (never committed — see `.env.example`)
- Table-driven tests for all Go handlers
