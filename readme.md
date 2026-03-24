# Checkpoint 🎮

A full-stack game tracking application. Search games, build your library, rate and review them, and track your gaming stats.

🔗 **Live Demo:** [checkpoint-delta.vercel.app](https://checkpoint-delta.vercel.app)
📄 **API Docs:** [Swagger UI](https://checkpoint-api-a06342829980.herokuapp.com/docs)

---

## Tech Stack

**Backend**
- Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic
- PostgreSQL, Pydantic (validation + settings)
- JWT authentication (bcrypt), async IGDB API integration (httpx)

**Frontend**
- React 18, TypeScript, Vite, TailwindCSS
- React Router, Axios, Recharts

**Infrastructure**
- Heroku (backend + PostgreSQL)
- Vercel (frontend, SPA routing)
- pytest (15 tests — auth, library, validation)

---

## Features

- **Authentication** — Register, login, JWT-based session management
- **Game Search** — Browse thousands of games via IGDB database
- **Library Management** — Track games as Playing, Completed, Want to Play, or Dropped
- **Ratings & Reviews** — Rate games on a 1–10 scale with an interactive selector, write reviews up to 2000 characters
- **Statistics Dashboard** — Pie charts, bar charts, and stat cards powered by Recharts
- **Smart Detail Page** — Detects if a game is already in your library; switch between "Add" and "Update" seamlessly
- **Critic Scores** — Aggregated critic ratings from IGDB displayed on game pages

---

## Architecture

```
Client (React + Vite)
  │
  ├── Axios + JWT interceptor
  │
  ▼
FastAPI Backend
  │
  ├── /auth     → JWT register / login / me
  ├── /games    → IGDB proxy (search + detail)
  ├── /library  → CRUD + stats (protected)
  │
  ├── SQLAlchemy 2.0 ORM
  ▼
PostgreSQL
```

**Key technical decisions:**
- **Separation of concerns** — SQLAlchemy models (`models.py`) and Pydantic schemas (`schemas.py`) are kept separate, following industry standard practices for independent evolution of database and API layers.
- **N+1 problem solved** — `game_name` and `game_cover_url` are stored directly on `UserGame` table, eliminating extra API calls when listing the library.
- **Token caching** — IGDB/Twitch OAuth token is cached at module level with automatic refresh on 401, avoiding unnecessary token requests.
- **Centralized config** — Single `config.py` using `pydantic-settings` as the only `.env` reading point. Heroku's `postgres://` → `postgresql://` conversion handled via property.

---

## Project Structure

```
checkpoint/
├── backend/
│   ├── main.py              # FastAPI app, CORS, router mounting
│   ├── config.py            # Pydantic Settings, centralized env
│   ├── database.py          # SQLAlchemy engine, session, get_db
│   ├── models.py            # User, UserGame tables
│   ├── schemas.py           # Pydantic schemas, GameStatus enum
│   ├── auth.py              # bcrypt hashing, JWT, get_current_user
│   ├── router_auth.py       # /auth endpoints
│   ├── router_games.py      # /games endpoints (IGDB proxy)
│   ├── router_library.py    # /library CRUD + stats
│   ├── igdb_service.py      # Async IGDB API client
│   ├── test_api.py          # 15 pytest tests
│   └── alembic/             # Database migrations
│
├── frontend/
│   └── src/
│       ├── api.ts           # Axios instance + JWT interceptor
│       ├── AuthContext.tsx   # Global auth state
│       ├── App.tsx           # Routes
│       ├── components/       # RatingSelector, Toast, Skeleton
│       └── pages/            # Home, Search, GameDetail, Library, Stats
│
├── Procfile                  # Heroku deployment
└── requirements.txt
```

---

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Fill in your credentials
alembic upgrade head
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` — backend runs on `http://localhost:8000`.

---

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry (default: 30) |
| `TWITCH_CLIENT_ID` | IGDB/Twitch API client ID |
| `TWITCH_CLIENT_SECRET` | IGDB/Twitch API client secret |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (e.g. `http://localhost:8000`) |

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Create account | — |
| POST | `/auth/login` | Get JWT token | — |
| GET | `/auth/me` | Current user info | ✓ |
| GET | `/games/search?query=` | Search IGDB | — |
| GET | `/games/{id}` | Game details | — |
| POST | `/library` | Add game to library | ✓ |
| GET | `/library` | List user's library | ✓ |
| PUT | `/library/{game_id}` | Update status/rating/review | ✓ |
| DELETE | `/library/{game_id}` | Remove from library | ✓ |
| GET | `/library/stats` | Library statistics | ✓ |

---

## Testing

```bash
cd backend
pytest test_api.py -v
```

15 tests covering authentication (register, login, token validation), library operations (add, update, delete, duplicates), and input validation (invalid status, rating bounds).

---

## License

This project was built as a portfolio project for learning purposes.
