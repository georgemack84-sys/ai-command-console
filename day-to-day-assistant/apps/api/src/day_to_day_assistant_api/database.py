from __future__ import annotations

import sqlite3
from contextlib import closing
from pathlib import Path


def connect(database_path: Path) -> sqlite3.Connection:
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def migrate(database_path: Path, migrations_dir: Path) -> None:
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "CREATE TABLE IF NOT EXISTS schema_migrations "
                "(version TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
            )
            applied = {
                row["version"]
                for row in connection.execute("SELECT version FROM schema_migrations").fetchall()
            }
            for migration in sorted(migrations_dir.glob("*.sql")):
                version = migration.stem
                if version in applied:
                    continue
                connection.executescript(migration.read_text(encoding="utf-8"))
                connection.execute("INSERT INTO schema_migrations(version) VALUES (?)", (version,))
