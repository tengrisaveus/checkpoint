from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, UniqueConstraint, Date, Boolean
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

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

    __table_args__ = (
        UniqueConstraint("user_id", "game_id", name="unique_user_game"),
    )

class DiaryEntry(Base):
    __tablename__ = "diary_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    game_id = Column(Integer, nullable=False)
    game_name = Column(String(255), nullable=False)
    game_cover_url = Column(String(500), nullable=True)
    played_at = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)
    rating = Column(Float, nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class GameList(Base):
    __tablename__ = "game_lists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class GameListItem(Base):
    __tablename__ = "game_list_items"

    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("game_lists.id", ondelete="CASCADE"), nullable=False)
    game_id = Column(Integer, nullable=False)
    game_name = Column(String(255), nullable=False)
    game_cover_url = Column(String(500), nullable=True)
    note = Column(Text, nullable=True)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("list_id", "game_id", name="unique_list_game"),
    )