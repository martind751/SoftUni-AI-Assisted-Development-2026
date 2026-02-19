# SoundScrAIbe

Personal music diary app that integrates with Spotify to help you track, rate, organize, and reflect on your listening habits. Built with Go, React, and PostgreSQL.

## Idea & Vision

SoundScrAIbe is your **personal music diary**. Connect your Spotify account and:
- **Rate** tracks, albums, and artists on a 1-10 scale
- **Organize** music with "On Rotation" and "Want to Listen" collections
- **Tag** anything with custom labels for personal categorization
- **Track** your listening history and discover patterns over time
- **Explore** detailed audio features, artist stats, and album info

Future: AI-powered insights and recommendations via Claude API.

## Features

### Authentication
- Spotify OAuth 2.0 with PKCE flow
- Secure session management with HttpOnly cookies

### Music Library
- **Rating System** — Rate tracks, albums, and artists 1-10 (Goodreads-style)
- **Collections** — Mark music as "On Rotation" or "Want to Listen"
- **Tags** — Custom user-defined tags per item (normalized, autocomplete)
- **Library Landing** — Pre-screen with 4 group cards (Rated, On Rotation, Want to Listen, Favorites) showing cover art previews and item counts
- **Library Groups** — Filterable/sortable grid per group with entity type tabs and pagination
- **Favorites** — Browse your Spotify liked tracks, saved albums, and followed artists

### Listening Analytics
- **Stats Dashboard** — Aggregate stats (streams, minutes, hours, unique tracks/artists/albums) with period filters (day/week/month/year/lifetime) and period-over-period % changes
- **Rankings** — Two-section page: "Spotify Top" (Spotify's algorithmic rankings for tracks/artists) and "My Listening" (DB-tracked play counts for tracks/artists/albums/genres). Time filters: 4 weeks, 6 months, all time
- **Listening Clocks** — 24-hour radial visualizations showing when you listen (streams and minutes by hour)
- **Recently Played** — Synced from Spotify with local persistence
- **Listening Stats** — Per-track play count, first/last played timestamps

### Detail Pages
- **Track** — Audio features (danceability, energy, acousticness, etc.), listening stats, like/unlike
- **Album** — Release info, genres, label, popularity, full track list
- **Artist** — Genres, followers, popularity, aggregated listening time

### Search
- Unified Spotify search across tracks, albums, and artists (debounced, paginated)

### Liked Songs
- Check, save, and remove tracks from Spotify library

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Go + Gin | Go 1.25, Gin 1.11 |
| Frontend | React + TypeScript + Vite | React 19, Vite 7, TS 5.9 |
| Styling | Tailwind CSS | v4 |
| Charts | Recharts | 3.7 |
| Database | PostgreSQL | 18 (Docker) |
| DB Driver | pgx | v5 |
| Migrations | golang-migrate | v4 |

## API Endpoints

### Public
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check |
| GET | `/api/auth/spotify` | OAuth config |
| POST | `/api/auth/callback` | Token exchange |
| POST | `/api/auth/logout` | Clear session |

### Protected (requires auth)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/me` | User profile |
| GET | `/api/recently-played` | Last 50 tracks |
| GET | `/api/artist-charts` | Top artists (query: `time_range`) |
| GET | `/api/search` | Search Spotify (query: `q`, `types`, `limit`) |
| GET | `/api/tracks/:id` | Track detail + audio features + stats |
| GET | `/api/albums/:id` | Album detail |
| GET | `/api/artists/:id` | Artist detail |
| GET | `/api/liked-songs/check` | Check saved tracks |
| PUT | `/api/liked-songs/:trackId` | Save to library |
| DELETE | `/api/liked-songs/:trackId` | Remove from library |
| GET/PUT/DELETE | `/api/ratings/:entityType/:entityId` | Rate entities |
| GET/PUT/DELETE | `/api/shelves/:entityType/:entityId` | Shelf management |
| GET/PUT | `/api/tags/:entityType/:entityId` | Tag items |
| GET | `/api/tags` | All user tags |
| GET | `/api/library` | Filtered library (query: `entity_type`, `shelf`, `tag`, `sort`, `page`, `limit`) |
| GET | `/api/library/summary` | Library group counts + cover art previews |
| GET | `/api/library/favorites` | Spotify liked tracks/saved albums/followed artists (query: `entity_type`, `page`, `limit`) |
| GET | `/api/stats/overview` | Aggregate listening stats (query: `period`: day/week/month/year/lifetime) |
| GET | `/api/stats/spotify-top` | Spotify's top tracks/artists (query: `type`: tracks/artists, `time_range`, `limit`) |
| GET | `/api/stats/my-top` | DB-tracked top items (query: `type`: tracks/artists/albums/genres, `time_range`, `limit`) |
| GET | `/api/stats/clock` | 24-hour listening distribution |

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Spotify users with OAuth tokens and profile data |
| `sessions` | Session tokens linked to users |
| `listening_history` | Synced recently-played tracks |
| `ratings` | User ratings 1-10 per entity |
| `shelves` | Shelf status per entity |
| `tags` | User-defined tag names |
| `item_tags` | Junction table linking tags to entities |
| `entity_metadata` | Cached entity metadata (name, image, extras) |

## Getting Started

### Prerequisites
- Go 1.25+
- Node.js 24+
- Docker & Docker Compose
- GNU Make: `winget install GnuWin32.Make` (restart terminal after install)
- Air (optional, for Go hot reload): `go install github.com/air-verse/air@latest`

### Setup

1. **Configure environment**
   ```bash
   cp .env.example .env
   # Fill in your Spotify Client ID/Secret and other values
   ```

2. **Start PostgreSQL**
   ```bash
   make docker-up
   ```

3. **Run backend** (in one terminal)
   ```bash
   make dev-backend
   ```

4. **Run frontend** (in another terminal)
   ```bash
   cd frontend && npm install
   make dev-frontend
   ```

5. **Access the app** at http://localhost:5173

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

### Ports
- Frontend dev server: **5173**
- Backend API: **8080**
- PostgreSQL (Docker): **5433**

### Database URL
```
postgres://soundscraibe:soundscraibe@localhost:5433/soundscraibe?sslmode=disable
```

## Project Structure

```
SoundScrAIbe/
├── backend/
│   ├── cmd/server/          # Entry point
│   └── internal/
│       ├── auth/            # OAuth, sessions, middleware
│       ├── db/              # Database connection
│       ├── handlers/        # HTTP handlers
│       ├── models/          # Data models
│       ├── repository/      # Database queries
│       ├── server/          # Router setup
│       ├── service/         # Business logic
│       └── spotify/         # Spotify API client
├── frontend/
│   └── src/
│       ├── components/      # Reusable UI (Navbar, RatingSelector, etc.)
│       ├── context/         # Auth context
│       ├── lib/             # API client, PKCE utils
│       └── pages/           # Route pages
├── migrations/              # PostgreSQL migration files
├── prompts/                 # AI prompt templates
├── docker-compose.yml
├── Makefile
├── CLAUDE.md                # Agent routing & conventions
├── CHANGELOG.md             # Feature history
└── README.md                # This file
```
