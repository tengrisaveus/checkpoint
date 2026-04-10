from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class GameListCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class GameListUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class GameListItemAdd(BaseModel):
    game_id: int
    note: str | None = Field(default=None, max_length=500)


class GameListItemResponse(BaseModel):
    id: int
    game_id: int
    game_name: str
    game_cover_url: str | None
    note: str | None
    position: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GameListResponse(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GameListDetailResponse(GameListResponse):
    items: list[GameListItemResponse] = []
