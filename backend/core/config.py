from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    twitch_client_id: str
    twitch_client_secret: str

    # Steam integration
    steam_api_key: str = ""
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "extra": "ignore"}

    @property
    def db_url(self) -> str:
        return self.database_url.replace("postgres://", "postgresql://", 1)


@lru_cache
def get_settings():
    return Settings()  # type: ignore
