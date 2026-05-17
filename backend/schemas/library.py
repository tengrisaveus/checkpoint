from pydantic import BaseModel, ConfigDict, Field, model_validator
from datetime import datetime
from enum import Enum
from typing import Self


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

    @model_validator(mode="after")
    def _rating_requires_completed(self) -> Self:
        if self.status != GameStatus.completed and (self.rating is not None or self.review):
            raise ValueError("Rating and review are only allowed when status is Completed")
        return self


class UserGameUpdate(BaseModel):
    # All fields optional — only provided fields will be updated (partial update)
    status: GameStatus | None = None
    rating: float | None = Field(default=None, ge=1, le=10)  # 1–10 scale
    review: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def _rating_requires_completed(self) -> Self:
        # Only validate when status is part of the same payload — partial updates
        # that change rating/review without touching status are checked at the router
        # level against the stored status.
        if self.status is not None and self.status != GameStatus.completed:
            if self.rating is not None or self.review:
                raise ValueError("Rating and review are only allowed when status is Completed")
        return self


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
