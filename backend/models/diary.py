from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Date
from sqlalchemy.sql import func
from core.database import Base


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
