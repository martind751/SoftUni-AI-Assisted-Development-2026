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

## Documentation Guardrail — MANDATORY

After every major feature, enhancement, or architectural change, the orchestrator MUST update documentation before considering the work complete. This is a **blocking requirement** — do not close out a task until docs are current.

### What Triggers a Doc Update

- New feature or page added
- New API endpoint(s) created
- Database schema changes (new tables, columns, migrations)
- New integration or external API added
- Significant refactoring that changes architecture
- Removal of features or deprecation of endpoints

### Files to Update

| File | What to Update |
|------|---------------|
| `README.md` | Features list, tech stack, API endpoints, setup instructions |
| `CLAUDE.md` | Agent routing rules (if new domains added), project conventions, any new patterns |
| `CHANGELOG.md` | Add entry with date, summary, and what changed |

### Update Checklist (follow after every major change)

1. **README.md** — Does the Features section reflect the current app? Are new endpoints listed? Is the tech stack accurate?
2. **CLAUDE.md** — Are there new conventions or patterns agents should follow? Any new agent routing keywords?
3. **CHANGELOG.md** — Add a dated entry describing what was added/changed/removed
4. **Migration count** — If DB schema changed, confirm the migration list in README is current

### How to Apply

- The orchestrator handles doc updates directly (no agent delegation needed)
- Update docs in the same conversation as the feature work, as a final step
- If the user commits, docs should be included in the same commit or a follow-up "docs:" commit

## Migration Guardrail — MANDATORY

When a new database migration is created, the orchestrator MUST apply it before considering the task done. This is a **blocking requirement**.

### Steps

1. **After creating migration files**, run the migration against the Docker PostgreSQL instance
2. **Verify** the migration applied cleanly by checking `schema_migrations` and the affected table(s)
3. **If the migration fails**, fix the SQL immediately — do not leave the DB in a dirty state
4. **To fix a dirty migration state**: `docker exec soundscraibe-db psql -U soundscraibe -d soundscraibe -c "UPDATE schema_migrations SET version = <last_clean>, dirty = false;"`
5. **Docker container name**: `soundscraibe-db`

### Common Pitfalls

- Inline CHECK constraints (without explicit names) get auto-generated names — use `pg_constraint` queries to find them before dropping
- Always DROP the old constraint BEFORE modifying data that would violate it
- golang-migrate runs the entire `.sql` file as a single execution — order matters

## Git Conventions

- When committing, **never stage files that are in `.gitignore`** (e.g. `*.exe`, `.env`, `node_modules/`)
- Always check `git status` and exclude gitignored/untracked files that shouldn't be committed
- Use the `martind751` GitHub account for pushing (switch with `gh auth switch --user martind751` if needed)

## Project Conventions

- **Ports**: Backend 8080, Frontend dev 5173, Docker PostgreSQL 5433
- **PostgreSQL 18**: Mount volumes at `/var/lib/postgresql` (not `/data`)
- **Testing**: `go test -v ./...` (no `-race` on Windows). Frontend: `npm test`
- **DB URL**: `postgres://soundscraibe:soundscraibe@localhost:5433/soundscraibe?sslmode=disable`
