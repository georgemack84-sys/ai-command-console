from __future__ import annotations

import socket
from contextlib import closing
from pathlib import Path
from typing import Any

from day_to_day_assistant_api.config import Settings
from day_to_day_assistant_api.database import connect, migrate


def sqlite_component(settings: Settings, root: Path) -> tuple[str, int]:
    migrations_dir = root / "apps" / "api" / "migrations"
    migrate(settings.database_path, migrations_dir)
    with closing(connect(settings.database_path)) as connection:
        migration_count = connection.execute("SELECT COUNT(*) AS count FROM schema_migrations").fetchone()[
            "count"
        ]
    return "healthy", int(migration_count)


def postgres_component(settings: Settings, timeout_seconds: float = 0.25) -> str:
    try:
        with socket.create_connection(
            (settings.postgres_host, settings.postgres_port),
            timeout=timeout_seconds,
        ):
            return "reachable"
    except OSError:
        return "unreachable"


def health_payload(settings: Settings, root: Path) -> dict[str, Any]:
    sqlite_status, migration_count = sqlite_component(settings, root)
    postgres_status = postgres_component(settings)
    required_database_status = "healthy" if sqlite_status == "healthy" else "unhealthy"
    aggregate = "healthy" if required_database_status == "healthy" else "unhealthy"
    return {
        "status": aggregate,
        "application": settings.application,
        "version": settings.version,
        "environment": settings.environment,
        "components": {
            "api": "healthy",
            "database": required_database_status,
            "sqlite_migrations": migration_count,
            "postgres": postgres_status,
        },
    }


def version_payload(settings: Settings) -> dict[str, str]:
    return {
        "application": settings.application,
        "version": settings.version,
        "commit": settings.commit,
        "environment": settings.environment,
        "build_time": settings.build_time,
    }
