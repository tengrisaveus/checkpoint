from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from limiter import limiter
from router_auth import router as auth_router
from router_games import router as games_router
from router_library import router as library_router
from router_diary import router as diary_router
from router_lists import router as lists_router
from router_profile import router as profile_router

app = FastAPI()
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://checkpoint-delta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(games_router, prefix="/games", tags=["Games"])
app.include_router(library_router, prefix="/library", tags=["Library"])
app.include_router(diary_router, prefix="/diary", tags=["Diary"])
app.include_router(lists_router, prefix="/lists", tags=["Lists"])
app.include_router(profile_router, prefix="/profile", tags=["Profile"])


@app.get("/")
def root():
    return {"message": "Checkpoint API is running"}


@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception:
        return {"status": "unhealthy", "database": "disconnected"}