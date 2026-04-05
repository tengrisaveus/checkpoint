from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime, date
from enum import Enum


# Allowed game statuses; stored as strings in the DB via .value
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
    # No password validation here — the hash comparison handles incorrect passwords
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    # from_attributes allows Pydantic to read values from SQLAlchemy model instances
    model_config = ConfigDict(from_attributes=True)


class UserGameCreate(BaseModel):
    game_id: int
    status: GameStatus
    rating: float | None = Field(default=None, ge=1, le=10)  # 1–10 scale
    review: str | None = Field(default=None, max_length=2000)


class UserGameUpdate(BaseModel):
    # All fields optional — only provided fields will be updated (partial update)
    status: GameStatus | None = None
    rating: float | None = Field(default=None, ge=1, le=10)  # 1–10 scale
    review: str | None = Field(default=None, max_length=2000)


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
    is_favorite: bool = False

    # from_attributes allows Pydantic to read values from SQLAlchemy model instances
    model_config = ConfigDict(from_attributes=True)

class DiaryEntryCreate(BaseModel):
    game_id: int
    played_at: date
    status: GameStatus
    rating: float | None = Field(default=None, ge=1, le=10)
    note: str | None = Field(default=None, max_length=500)

class DiaryEntryResponse(BaseModel):
    id: int
    game_id: int
    game_name: str
    game_cover_url: str | None
    played_at: date
    status: str
    rating: float | None
    note:str | None
    created_at: datetime