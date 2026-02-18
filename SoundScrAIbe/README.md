# SoundScrAIbe

A personal music diary app. Log your listening history, rate and review artists/albums/songs, organize music into shelves, and get AI-powered recommendations.

## Tech Stack

- **Backend:** Go (Gin framework)
- **Frontend:** React (Vite + TypeScript + Tailwind CSS v4)
- **Database:** PostgreSQL 18 (Docker)

## Getting Started

### Prerequisites

- Go 1.25+
- Node.js 24+
- Docker & Docker Compose
- GNU Make: `winget install GnuWin32.Make` (restart terminal after install)
- Air (optional, for Go hot reload): `go install github.com/air-verse/air@latest`

### Setup

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
2. Start the database:
   ```bash
   make docker-up
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend && npm install
   ```
4. Run the backend (in one terminal):
   ```bash
   make dev-backend
   ```
5. Run the frontend (in another terminal):
   ```bash
   make dev-frontend
   ```
6. Open http://localhost:5173

### Available Commands

| Command             | Description                    |
|---------------------|--------------------------------|
| `make dev-backend`  | Start Go server with Air       |
| `make dev-frontend` | Start Vite dev server          |
| `make build`        | Build backend and frontend     |
| `make test`         | Run all tests                  |
| `make docker-up`    | Start PostgreSQL               |
| `make docker-down`  | Stop PostgreSQL                |
| `make lint`         | Run linters                    |

### API

- `GET /api/health` — Health check (returns DB connectivity status)
