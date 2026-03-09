from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    anthropic_api_key: str
    job_refresh_interval_hours: int = 6
    fetch_timeout_seconds: int = 15

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
