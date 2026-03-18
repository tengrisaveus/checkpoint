from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class GameStatus(str, Enum):
    playing = "Playing"
    completed = "Completed"
    want_to_play = "Want to Play"
    dropped = "Dropped"


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserGameCreate(BaseModel):
    game_id: int
    status: GameStatus
    rating: Optional[float] = Field(default=None, ge=1, le=10)
    review: Optional[str] = Field(default=None, max_length=2000)


class UserGameUpdate(BaseModel):
    status: Optional[GameStatus] = None
    rating: Optional[float] = Field(default=None, ge=1, le=10)
    review: Optional[str] = Field(default=None, max_length=2000)


class UserGameResponse(BaseModel):
    id: int
    game_id: int
    game_name: str
    game_cover_url: str | None
    status: str
    rating: float | None
    review: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)