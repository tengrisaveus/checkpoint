from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from core.config import get_settings

settings = get_settings()

# pool_pre_ping: Heroku Postgres drops connections that have been idle for a
# while, so we run a quick SELECT 1 before each query to check liveness.
# pool_recycle: connections older than 5 minutes are refreshed proactively;
# this reduces the chance of getting caught by an idle drop.
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