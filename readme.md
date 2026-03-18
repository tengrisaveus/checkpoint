# Checkpoint 🎮

A game tracking application inspired by Letterboxd and Backloggd. Track your gaming library, rate and review games, and see your gaming statistics.

## Tech Stack

**Backend:** Python, FastAPI, PostgreSQL, SQLAlchemy, Alembic, JWT  
**Frontend:** React, TypeScript, Vite, TailwindCSS  
**API:** IGDB (Twitch) for game data

## Features

- User authentication (register, login, JWT)
- Search games via IGDB database
- Track games as Playing / Completed / Want to Play / Dropped
- Rate games (1-10) and write reviews
- Personal game library with filtering

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Fill in your credentials
alembic upgrade head
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

Backend running → visit `http://localhost:8000/docs`