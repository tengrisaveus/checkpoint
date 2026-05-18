from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from core.config import get_settings

settings = get_settings()

# pool_pre_ping: Heroku Postgres bir süre idle kalan bağlantıları drop ediyor,
# her query öncesi hızlı bir SELECT 1 ile bağlantı canlı mı kontrol ediliyor.
# pool_recycle: 5 dakikadan eski bağlantılar zaten yenileniyor; idle drop'a
# yakalanma şansı düşüyor.
engine = create_engine(
    settings.db_url,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()