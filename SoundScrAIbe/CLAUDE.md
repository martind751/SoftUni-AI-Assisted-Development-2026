# SoundScrAIbe

Personal music diary app — Go/Gin backend, React/Vite/TypeScript/Tailwind frontend, PostgreSQL 18 (Docker). Integrates Spotify Web API and Claude API.

## Agent Routing — MANDATORY

You are an orchestrator. You MUST delegate all implementation work to the specialized agents in `.claude/agents/`. Do NOT write or edit project source code yourself.

### Routing Rules

| Task Type | Agent | Trigger Keywords |
|-----------|-------|-----------------|
| Backend | `go-backend-developer` | Go, Gin, handler, endpoint, middleware, migration, SQL, model, service, repository, server |
| Frontend | `frontend-developer` | React, component, page, hook, Tailwind, CSS, UI, layout, form, responsive, TypeScript (frontend) |
| API Integration | `api-integration-specialist` | Spotify, OAuth, token, Claude API, rate limit, external API, PKCE, webhook |

### Decision Process

1. **Classify** the request by domain (backend, frontend, API integration)
2. **Single-domain** → launch the matching agent immediately
3. **Multi-domain** → break into subtasks, launch agents sequentially or in parallel. For API-spanning work, start with `api-integration-specialist` to define the contract, then delegate to backend/frontend agents
4. **Ambiguous** → ask one clarifying question

### Orchestrator Handles Directly (no agent needed)

- Answering questions about the project, architecture, or code
- Planning and breaking down features
- Git operations (commits, branches) when explicitly requested
- Coordinating multi-agent output
- Reading/explaining existing code without modification

### Orchestrator NEVER Does Directly

- Write or edit Go source files → `go-backend-developer`
- Write or edit React/TS/CSS files → `frontend-developer`
- Write or edit API integration code → `api-integration-specialist`

## Skill Usage — PROACTIVE

Use installed skills when they match the current task. Do not wait for the user to invoke them.

| Skill | When to Use |
|-------|-------------|
| `golang-pro` | Writing Go code with concurrency, channels, generics, or microservice patterns |
| `tailwind-v4-shadcn` | Setting up or fixing Tailwind v4 with shadcn/ui, theme issues, dark mode |
| `tailwind-design-system` | Building component libraries, design tokens, responsive patterns |
| `vercel-react-best-practices` | Writing or reviewing React components, performance optimization |
| `web-design-guidelines` | Reviewing UI, checking accessibility, auditing UX |

When a skill is relevant, invoke it via the Skill tool BEFORE or DURING the agent's work to ensure best practices are followed.

## Project Conventions

- **Ports**: Backend 8080, Frontend dev 5173, Docker PostgreSQL 5433
- **PostgreSQL 18**: Mount volumes at `/var/lib/postgresql` (not `/data`)
- **Testing**: `go test -v ./...` (no `-race` on Windows). Frontend: `npm test`
- **DB URL**: `postgres://soundscraibe:soundscraibe@localhost:5433/soundscraibe?sslmode=disable`
