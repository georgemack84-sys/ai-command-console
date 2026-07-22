from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    application: str
    version: str
    build_time: str
    commit: str
    environment: str
    api_host: str
    api_port: int
    database_path: Path
    database_url: str
    postgres_host: str
    postgres_port: int
    postgres_db: str
    postgres_user: str
    log_level: str
    ai_provider: str
    require_confirmation: bool
    cors_origins: tuple[str, ...]


class ConfigurationError(ValueError):
    pass


def _int_from_env(name: str, default: str) -> int:
    value = os.getenv(name, default)
    try:
        return int(value)
    except ValueError as exc:
        raise ConfigurationError(f"{name} must be an integer.") from exc


def load_settings() -> Settings:
    api_port = _int_from_env("D2D_API_PORT", "8010")
    postgres_port = _int_from_env("D2D_POSTGRES_PORT", "5432")
    if not 1 <= api_port <= 65535:
        raise ConfigurationError("D2D_API_PORT must be between 1 and 65535.")
    if not 1 <= postgres_port <= 65535:
        raise ConfigurationError("D2D_POSTGRES_PORT must be between 1 and 65535.")

    return Settings(
        application="day-to-day-assistant-api",
        version=os.getenv("D2D_APP_VERSION", "0.1.0-bootstrap"),
        build_time=os.getenv("D2D_BUILD_TIME", "local"),
        commit=os.getenv("D2D_COMMIT", "unknown"),
        environment=os.getenv("D2D_ENV", "development"),
        api_host=os.getenv("D2D_API_HOST", "127.0.0.1"),
        api_port=api_port,
        database_path=Path(os.getenv("D2D_DATABASE_PATH", "data/day_to_day_assistant.sqlite3")),
        database_url=os.getenv(
            "D2D_DATABASE_URL",
            "postgresql://d2d:d2d_dev_password@127.0.0.1:5432/day_to_day_assistant",
        ),
        postgres_host=os.getenv("D2D_POSTGRES_HOST", "127.0.0.1"),
        postgres_port=postgres_port,
        postgres_db=os.getenv("D2D_POSTGRES_DB", "day_to_day_assistant"),
        postgres_user=os.getenv("D2D_POSTGRES_USER", "d2d"),
        log_level=os.getenv("D2D_LOG_LEVEL", "INFO"),
        ai_provider=os.getenv("D2D_AI_PROVIDER", "mock"),
        require_confirmation=os.getenv("D2D_REQUIRE_CONFIRMATION", "true").lower() == "true",
        cors_origins=tuple(
            origin.strip()
            for origin in os.getenv("D2D_CORS_ORIGINS", "http://127.0.0.1:5174").split(",")
            if origin.strip()
        ),
    )
