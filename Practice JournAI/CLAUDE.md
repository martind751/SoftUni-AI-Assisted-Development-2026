# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Practice JournAI — a web app for musicians to track practice sessions, manage repertoire, and visualize progress. Go backend + React frontend monorepo.

## Tech Stack

- **Backend:** Go 1.24, Gin, Bun ORM, PostgreSQL 18
- **Frontend:** Vite, React 19, TypeScript (strict), TanStack Router, TanStack Query, Zod, Tailwind CSS v4
- **Infrastructure:** Docker Compose (PostgreSQL on port 5433)

## Commands

```bash
# Full stack (requires Docker running)
make dev                       # Start Postgres + backend + frontend

# Individual services
docker compose up -d           # Start PostgreSQL
make dev-backend               # Go backend only (port 8080)
make dev-frontend              # Frontend dev server only (port 5173)

# Build & test
make build                     # Build Go binary to bin/server
make test                      # go test -v ./...
make lint                      # go fmt + go vet

# Run a single Go test
go test -v -run TestFunctionName ./internal/sessions/

# Frontend
cd frontend && npm run dev     # Dev server
cd frontend && npm run build   # Production build
```

**Note:** Do NOT use `-race` flag — CGO is disabled on Windows Git Bash.

## Architecture

### Backend: Three-Layer Pattern

Each domain lives in `internal/{domain}/` with four files:

| File | Responsibility |
|------|---------------|
| `handler.go` | HTTP layer — parse requests via `ShouldBindJSON`, map service errors to status codes via `mapErrorToStatus()`, return JSON |
| `service.go` | Business logic — validate inputs, define sentinel errors (`ErrNotFound`, `ErrInvalidID`), call repository, return response DTOs |
| `repository.go` | Data access — Bun ORM queries, accepts `context.Context`, returns DB models |
| `models.go` | DB models (bun tags, UUID PKs) + request/response structs with `toResponse()` conversion methods |

**Wiring:** Dependencies are injected via constructors in `internal/server/server.go`:
```
Repository(db) → Service(repo) → Handler(service) → router.Group()
```

**Current domains:** health, sessions (with notes sub-resource), songs (with MusicBrainz search)

**API prefix:** All routes under `/api/v1/`

**Database:** UUIDs for PKs (`gen_random_uuid()`), timestamps on all entities. Migrations in `internal/database/migrations/` run automatically on startup.

### Frontend: Feature-Based + Schema-First

Data flow per feature in `frontend/src/features/{name}/`:

```
schemas/ (Zod)  →  types/ (z.infer)  →  hooks/ (TanStack Query)  →  components/
```

**Key patterns:**
- **Query key factory:** Each feature defines a `{name}Keys` object with `all`, `list(filters)`, `detail(id)` methods
- **Zod validation on fetch:** Every API response is parsed through Zod schemas before reaching components
- **Mutation cache invalidation:** `onSuccess` invalidates the feature's `all` query key
- **File-based routing:** Routes in `frontend/src/routes/` auto-generate `routeTree.gen.ts` — never edit that file manually
- **Vite proxy:** `/api` requests proxy to `http://localhost:8080` (configured in `vite.config.ts`)

**Genre theming system:** CSS custom properties per genre (jazz, blues, rock_metal, all) in `app.css`, managed by `GenreContext` with localStorage persistence. Components use `var(--genre-*)` variables.

## Conventions

- Types MUST be derived from Zod via `z.infer<typeof schema>` — never duplicate manually
- Backend tests are table-driven integration tests against real PostgreSQL (skipped if `DATABASE_URL` not set)
- Service layer defines domain errors as sentinel values; handlers map them to HTTP status codes
- Request/response structs live alongside DB models in `models.go`, with `toResponse()` methods for conversion
- CORS allows `http://localhost:5173`
- Environment config via `.env` (see `.env.example` for required vars: `DATABASE_URL`, `SERVER_PORT`, `GIN_MODE`)
- PostgreSQL volume mounts at `/var/lib/postgresql` (not `/data`) due to PG 18 changes
- Docker Postgres maps to port 5433 to avoid conflict with any local PostgreSQL instance

## Adding a New Domain

**Backend:**
1. Create migration in `internal/database/migrations/`
2. Create `internal/{domain}/` with models, repository, service, handler
3. Wire up in `internal/server/server.go` (repo → service → handler → route group)
4. Write table-driven tests in `handler_test.go`

**Frontend:**
1. Create `features/{name}/schemas/` with Zod schemas
2. Create `types/` deriving from schemas via `z.infer`
3. Create `hooks/` with query key factory + TanStack Query hooks
4. Create `components/` using the hooks
5. Add route files in `routes/` if needed
