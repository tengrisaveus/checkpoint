from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router_auth import router as auth_router
from router_games import router as games_router
from router_library import router as library_router
from router_diary import router as diary_router

app = FastAPI()

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

@app.get("/")
def root():
    return {"message": "Checkpoint API is running"}