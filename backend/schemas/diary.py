from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date
from schemas.library import GameStatus


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
    note: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
