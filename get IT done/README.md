# get IT done

A full-stack task management application built to help you organize projects, track goals, and get things done.

## 🤖 How It Was Built

**This app is fully vibecoded.** It was built entirely through AI-assisted development using [GitHub Copilot](https://github.com/features/copilot) in VS Code — with prompts, conversations, and iterative refinement rather than traditional manual coding.

Multiple AI models were used throughout the process, including **Claude** and **GPT-5.2**, depending on the task at hand. The entire codebase — frontend, backend, database models, API routes, styling, and even this README — was generated through natural language conversations with Copilot.

No code was written by hand. Every feature, bug fix, and design decision was driven by describing what was needed and letting the AI generate the implementation.

## What It Does

**get IT done** is a productivity app with:

- **Dashboard** — Quick overview of overdue tasks, due today, active tasks, and completion stats
- **Statistics** — Detailed productivity metrics, completion trends, priority/category/project breakdowns
- **Task Management** — Create, edit, delete, and complete tasks with priorities, due dates, and status tracking
- **Projects** — Group tasks under projects with color coding and descriptions
- **Categories** — Organize tasks by category
- **Goals** — Set and track goals
- **Tags** — Flexible tagging system for tasks
- **Filtering & Sorting** — Filter tasks by status, priority, project, category; sort by various fields

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, plain CSS (glassmorphism dark theme) |
| **Backend** | Express 5, Node.js |
| **Database** | MongoDB with Mongoose 9 |
| **Monorepo** | pnpm workspaces |
| **Dev tooling** | ESLint, concurrently |

## Project Structure

```
get IT done/
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── api/            # API client functions
│       ├── components/     # React components
│       └── assets/
├── server/                 # Express backend
│   └── src/
│       ├── config/         # DB & env config
│       ├── middleware/      # Error handling, async wrapper
│       ├── models/         # Mongoose models (Task, Project, Category, Goal, Tag)
│       └── routes/         # REST API routes
├── package.json            # Root workspace config
└── pnpm-workspace.yaml
```

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **pnpm** (v10+) — install with `npm install -g pnpm`
- **MongoDB** — running locally on `mongodb://127.0.0.1:27017` or a remote instance

## Setup

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd "get IT done"
```

### 2. Install dependencies

```bash
pnpm install
```

This installs dependencies for both `client/` and `server/` workspaces.

### 3. Configure environment

Create a `.env` file in the `server/` directory:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/get-it-done
```

Both values have defaults, so the `.env` file is optional if you're running MongoDB locally on the default port.

### 4. Seed the database (optional)

To populate the database with sample data:

```bash
cd server
node src/seed.js
```

### 5. Run the app

From the root directory, start both frontend and backend:

```bash
pnpm dev
```

This runs:
- **Server** at `http://localhost:4000` (Express API)
- **Client** at `http://localhost:5173` (Vite dev server, proxies `/api` to the server)

You can also run them separately:

```bash
pnpm dev:server    # backend only
pnpm dev:client    # frontend only
```

### 6. Build for production

```bash
pnpm build
```

Builds the React frontend into `client/dist/`.

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/health` | Health check |
| `GET/POST` | `/api/tasks` | List / create tasks |
| `PUT/DELETE` | `/api/tasks/:id` | Update / delete task |
| `GET/POST` | `/api/projects` | List / create projects |
| `PUT/DELETE` | `/api/projects/:id` | Update / delete project |
| `GET/POST` | `/api/categories` | List / create categories |
| `PUT/DELETE` | `/api/categories/:id` | Update / delete category |
| `GET/POST` | `/api/goals` | List / create goals |
| `PUT/DELETE` | `/api/goals/:id` | Update / delete goal |
| `GET/POST` | `/api/tags` | List / create tags |
| `PUT/DELETE` | `/api/tags/:id` | Update / delete tag |
| `GET` | `/api/stats` | Dashboard & statistics data |

## License

This project is private and not licensed for redistribution.
