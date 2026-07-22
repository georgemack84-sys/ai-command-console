from __future__ import annotations

import json
import uuid
from contextlib import closing
from pathlib import Path
from typing import Any

from day_to_day_assistant_api.database import connect


SECRET_KEYS = {"password", "password_confirmation", "current_password", "new_password", "token", "cookie"}


def redact_metadata(metadata: dict[str, Any]) -> dict[str, Any]:
    redacted: dict[str, Any] = {}
    for key, value in metadata.items():
        if key.lower() in SECRET_KEYS or "password" in key.lower() or "token" in key.lower():
            redacted[key] = "[REDACTED]"
        else:
            redacted[key] = value
    return redacted


def record_audit_event(
    database_path: Path,
    event_type: str,
    actor_type: str,
    outcome: str,
    request_id: str,
    actor_id: str | None = None,
    session_id: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> str:
    event_id = str(uuid.uuid4())
    metadata_json = json.dumps(redact_metadata(metadata or {}), sort_keys=True)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO audit_events_v2 (
                  id, event_type, actor_type, actor_id, session_id, resource_type, resource_id,
                  request_id, outcome, metadata_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event_id,
                    event_type,
                    actor_type,
                    actor_id,
                    session_id,
                    resource_type,
                    resource_id,
                    request_id,
                    outcome,
                    metadata_json,
                ),
            )
    return event_id


def list_audit_events(database_path: Path) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            """
            SELECT id, event_type, actor_type, actor_id, session_id, resource_type, resource_id,
                   request_id, outcome, metadata_json, occurred_at, recorded_at
            FROM audit_events_v2
            ORDER BY occurred_at DESC
            LIMIT 100
            """
        ).fetchall()
    return [_row_to_event(row) for row in rows]


def get_audit_event(database_path: Path, event_id: str) -> dict[str, Any] | None:
    with closing(connect(database_path)) as connection:
        row = connection.execute(
            """
            SELECT id, event_type, actor_type, actor_id, session_id, resource_type, resource_id,
                   request_id, outcome, metadata_json, occurred_at, recorded_at
            FROM audit_events_v2
            WHERE id = ?
            """,
            (event_id,),
        ).fetchone()
    return _row_to_event(row) if row else None


def _row_to_event(row: Any) -> dict[str, Any]:
    return {
        "id": row["id"],
        "event_type": row["event_type"],
        "actor_type": row["actor_type"],
        "actor_id": row["actor_id"],
        "session_id": row["session_id"],
        "resource_type": row["resource_type"],
        "resource_id": row["resource_id"],
        "request_id": row["request_id"],
        "outcome": row["outcome"],
        "metadata": json.loads(row["metadata_json"]),
        "occurred_at": row["occurred_at"],
        "recorded_at": row["recorded_at"],
    }
