from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.sql import func
from core.database import Base


class ConnectedAccount(Base):
    """
    External gaming platform connection (Steam, RetroAchievements, etc.).
    Stores both identity (external_id, display_name, avatar) and a cached
    showcase payload (platform-specific JSON: recent games, playtime, etc.).
    """
    __tablename__ = "connected_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(20), nullable=False)
    external_id = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    showcase_data = Column(JSON, nullable=True)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "platform", name="unique_user_platform"),
    )
