# Changelog

All notable changes to SoundScrAIbe are documented here. Updated after every major feature or enhancement.

## 2026-02-20

### Changed
- **Color scheme rebrand** — Replaced Spotify green accent (`green-400/500`) with Indigo/Deep Purple (`indigo-400/500`, `violet-500`) to give SoundScrAIbe its own visual identity. Migrated all background/text/border colors from `gray-*` to `slate-*` for a cooler, more cohesive dark theme. Updated Recharts chart fills to match. 18 files updated across components and pages.

## 2026-02-19

### Added
- **Stats dashboard** — Aggregate listening stats (streams, minutes, hours, unique tracks/artists/albums) with period filters (day/week/month/year/lifetime) and period-over-period % change badges
- **Top rankings** — Top tracks, artists, albums, and genres combining Spotify API rankings with local DB play counts/minutes. Time filters: 4 weeks, 6 months, lifetime
- **Listening clocks** — Two 24-hour Recharts radar charts showing stream and minute distribution by hour
- **Stats page** — New `/stats` route with all three sections, nav bar integration
- **Stats API endpoints** — `GET /api/stats/overview`, `GET /api/stats/top`, `GET /api/stats/clock`
- **Spotify client: GetTopTracks** — Fetches user's top tracks by time range
- **Migration 000007** — Adds `album_id` and `album_name` to `listening_history` for album-level analytics
- **Album backfill** — `syncListeningHistory` now stores album data and backfills existing rows on re-sync

### Added
- **Library pre-screen** — Landing page at `/library` with 4 group cards (Rated, On Rotation, Want to Listen, Favorites) showing 2x2 cover art grids and item counts
- **Library group pages** — Each group has its own detail view at `/library/:group` with entity type tabs, sort, and pagination
- **Favorites group** — Browse Spotify liked tracks, saved albums, and followed artists with entity type filtering
- **Library summary endpoint** — `GET /api/library/summary` returns counts and cover art for each group
- **Favorites endpoint** — `GET /api/library/favorites` fetches Spotify saved items by entity type
- **Spotify API additions** — `GetSavedTracks`, `GetSavedAlbums`, `GetFollowedArtists` client functions

### Changed
- **Reworked shelf system** — Replaced Goodreads-style shelves (listened/currently listening/want to listen) with music-native model: "On Rotation" (what you're vibing with) and "Want to Listen" (your backlog). Ratings now serve as the primary "I engaged with this" signal, making the old "Listened" shelf redundant.
- **Migration 000006** — Removes `listened` shelf entries, renames `currently_listening` to `on_rotation`

### Added
- **Rating system** — Rate tracks, albums, and artists on a 1-10 scale
- **Tags** — Custom user-defined tags with autocomplete
- **Library page** — Filterable/sortable grid of all rated, shelved, and tagged music
- **Search** — Unified Spotify search across tracks, albums, and artists
- **Navbar** — Navigation bar with search, profile, and home links
- **Redesigned home page** — Dashboard with quick-links when logged in

### Added
- **Track detail page** — Audio features (danceability, energy, etc.), listening stats, like/unlike
- **Album detail page** — Release info, genres, label, popularity, track list
- **Artist detail page** — Genres, followers, aggregated listening stats

### Added
- **Artist charts** — Top artists by time range with Recharts bar visualization
- **Listening history** — Recently played tracks synced from Spotify with local persistence
- **Liked songs** — Check/save/remove tracks from Spotify library
- **Liked songs percentage** — Profile stat showing % of recently played tracks that are liked

## 2026-02-18

### Added
- **Spotify OAuth 2.0 with PKCE** — Full authentication flow with secure session cookies
- **Profile page** — Display Spotify user data (name, avatar, email, country, product tier, followers)
- **Auto-migration** — Database migrations run automatically on server start
- **Entity metadata caching** — Cached names and images for rated/shelved/tagged items

### Infrastructure
- **Project scaffold** — Go/Gin backend, React/Vite/TypeScript frontend, PostgreSQL 18 (Docker)
- **Claude Code agents** — Specialized agents for backend, frontend, and API integration
- **Makefile** — Dev commands for backend, frontend, Docker, build, test, lint
- **Docker Compose** — PostgreSQL 18 on port 5433

## Database Migrations (current)

1. `000001_create_users_table` — Users with Spotify profile data
2. `000002_create_sessions_table` — Session management
3. `000003_create_listening_history_table` — Track play history
4. `000004_add_user_profile_fields` — Extended profile (country, product, followers)
5. `000005_create_ratings_table` — Entity ratings
6. `000006_create_shelves_table` — Shelf organization
7. `000007_create_tags_tables` — Tags and item_tags junction
8. `000008_create_entity_metadata_table` — Cached entity metadata
9. `000006_rework_shelves` — Replace 3-shelf model with on_rotation + want_to_listen
10. `000007_add_album_to_listening_history` — Add album_id/album_name columns + indexes
