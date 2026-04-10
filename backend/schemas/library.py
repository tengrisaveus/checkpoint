from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from enum import Enum


# Allowed game statuses; stored as strings in the DB via .value
class GameStatus(str, Enum):
    playing = "Playing"
    completed = "Completed"
    want_to_play = "Want to Play"
    dropped = "Dropped"


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
