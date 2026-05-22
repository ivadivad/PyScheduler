# PyScheduler — Python Job Orchestrator

A professional MVP SaaS system for scheduling and orchestrating Python scripts, built with FastAPI, APScheduler, React, and PostgreSQL.

![Dashboard](https://img.shields.io/badge/status-MVP-6366f1?style=flat-square)
![Python](https://img.shields.io/badge/python-3.11-3b82f6?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-10b981?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square)

---

## Features

- **Job Management** — Create, edit, duplicate, pause, resume, delete scheduled jobs
- **Multiple Schedule Types** — Cron expressions, intervals, daily, weekly, monthly, one-time
- **Python Executor** — Run scripts in isolated subprocesses with timeout, stdout/stderr capture, and retry logic
- **Real-time Logs** — WebSocket streaming of execution output with terminal-style viewer
- **Execution History** — Complete audit trail with status, duration, exit code, and full logs
- **Dashboard** — Metrics, success rate, timeline, system health
- **Retry System** — Configurable max retries with delay
- **JWT Auth** — Secure login/logout with access + refresh tokens
- **Dark Mode UI** — Professional dark theme inspired by Linear, Vercel, and Railway

---

## Quick Start (Docker)

```bash
# Clone and start
git clone <repo>
cd python-scheduler

# Copy environment file
cp .env.example .env

# Start everything
docker-compose up --build
```

The system will:
1. Start PostgreSQL
2. Run the backend (creates tables + seeds example data)
3. Start the frontend

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Default credentials:**
```
Email:    admin@scheduler.local
Password: admin123
```

---

## Local Development

### Backend

```bash
cd backend

# Create virtualenv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start PostgreSQL (Docker)
docker run -d \
  --name scheduler_db \
  -e POSTGRES_USER=scheduler \
  -e POSTGRES_PASSWORD=scheduler123 \
  -e POSTGRES_DB=scheduler_db \
  -p 5432:5432 \
  postgres:16-alpine

# Run seed
python seed.py

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

npm install
npm run dev
# → http://localhost:5173
```

---

## Architecture

```
python-scheduler/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + lifespan hooks
│   │   ├── api/routes/          # REST endpoints + WebSocket
│   │   ├── core/                # Config, DB, JWT security
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic DTOs
│   │   ├── repositories/        # Data access layer
│   │   ├── services/            # Business logic
│   │   ├── scheduler/           # APScheduler setup + sync
│   │   └── executor/            # Python subprocess executor + WS manager
│   ├── scripts/                 # Example Python scripts
│   └── seed.py                  # Initial data
└── frontend/
    └── src/
        ├── pages/               # Login, Dashboard, Jobs, Executions, Logs, Monitoring, Settings
        ├── components/          # Reusable UI components
        ├── hooks/               # React Query hooks
        ├── stores/              # Zustand auth store
        └── lib/                 # API client, utilities
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 + TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| State | TanStack Query v5 + Zustand v4 |
| Backend | FastAPI 0.109 + Python 3.11 |
| Database | PostgreSQL 16 + SQLAlchemy 2 async |
| Scheduler | APScheduler 3.10 (SQLAlchemy job store) |
| Auth | JWT (python-jose + passlib/bcrypt) |
| Real-time | WebSocket (FastAPI native) |
| Container | Docker + Docker Compose |

---

## API Overview

```
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/jobs                   List + filter + search
POST   /api/jobs                   Create job
GET    /api/jobs/{id}
PUT    /api/jobs/{id}
DELETE /api/jobs/{id}
POST   /api/jobs/{id}/run          Manual trigger
POST   /api/jobs/{id}/pause
POST   /api/jobs/{id}/resume
POST   /api/jobs/{id}/duplicate

GET    /api/executions             List executions
GET    /api/executions/{id}
POST   /api/executions/{id}/cancel
GET    /api/executions/{id}/logs

GET    /api/dashboard/metrics
GET    /api/dashboard/timeline

GET    /api/logs/export?execution_id=...

WS     /ws/executions/{id}         Real-time log stream

GET    /api/health
```

Full interactive docs available at `http://localhost:8000/docs`.

---

## Adding Python Scripts

Place `.py` files in `backend/scripts/`. The scheduler will look for scripts relative to the `SCRIPTS_DIR` (default: `./scripts`).

Example:
```python
# backend/scripts/my_job.py
import sys
print("Starting my job...")
# ... your logic
sys.exit(0)  # exit 0 = success, any other code = failure
```

Then create a job in the UI with script path `my_job.py`.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | postgresql+asyncpg://… | Async DB URL |
| `DATABASE_SYNC_URL` | postgresql://… | Sync DB URL (APScheduler) |
| `SECRET_KEY` | — | JWT signing key (change in prod!) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 30 | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | 7 | Refresh token TTL |
| `SCRIPTS_DIR` | ./scripts | Directory for Python scripts |
| `MAX_CONCURRENT_EXECUTIONS` | 5 | Execution concurrency limit |
| `CORS_ORIGINS` | http://localhost:5173 | Allowed CORS origins |

---

## Production Checklist

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Use strong database password
- [ ] Enable HTTPS (reverse proxy: nginx/Caddy)
- [ ] Set `CORS_ORIGINS` to your actual frontend domain
- [ ] Mount a persistent volume for `backend/scripts`
- [ ] Set up database backups
- [ ] Configure log retention policy

---

## Roadmap

- [ ] Email / Slack notifications on failure
- [ ] Multi-tenant support
- [ ] Script upload via UI
- [ ] Environment variable management UI
- [ ] Execution resource monitoring (CPU/memory)
- [ ] Distributed workers
- [ ] Container-based execution (Docker)
- [ ] Metrics export (Prometheus)
