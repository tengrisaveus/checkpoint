from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, UniqueConstraint, Boolean
from sqlalchemy.sql import func
from core.database import Base


class UserGame(Base):
    __tablename__ = "user_games"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    game_id = Column(Integer, nullable=False)
    game_name = Column(String(255), nullable=False)
    game_cover_url = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False)
    rating = Column(Float, nullable=True)
    review = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_favorite = Column(Boolean, default=False)
    game_genres = Column(String(500), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "game_id", name="unique_user_game"),
    )
