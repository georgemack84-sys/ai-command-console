from __future__ import annotations

import base64
import hashlib
import json
import secrets
import time
import uuid
from contextlib import closing
from datetime import timedelta
from pathlib import Path
from typing import Any

from day_to_day_assistant_api.audit import record_audit_event
from day_to_day_assistant_api.auth import AuthError, AuthenticatedContext, iso_now, parse_iso, utc_now
from day_to_day_assistant_api.database import connect
from day_to_day_assistant_api.productivity import record_activity


DEFAULT_SCOPES = {
    "EMAIL": ["READ", "SYNC"],
    "CALENDAR": ["READ", "SYNC"],
    "CONTACTS": ["READ", "SYNC"],
    "STORAGE": ["READ", "SYNC"],
}


MOCK_REMOTE = {
    "EMAIL": [
        {"external_id": "email-001", "title": "Inbox: Project update", "summary": "Unread email metadata from local provider.", "payload": {"from": "alex@example.com", "label": "inbox"}},
        {"external_id": "email-002", "title": "Inbox: Dentist reminder", "summary": "Appointment reminder metadata.", "payload": {"from": "office@example.com", "label": "inbox"}},
    ],
    "CALENDAR": [
        {"external_id": "event-001", "title": "External planning meeting", "summary": "Imported external calendar event metadata.", "payload": {"start_at": "2026-07-20T14:00:00+00:00"}},
    ],
    "CONTACTS": [
        {"external_id": "contact-001", "title": "Alex Morgan", "summary": "alex@example.com", "payload": {"display_name": "Alex Morgan", "email": "alex@example.com", "phone": "+1-555-0100"}},
    ],
    "STORAGE": [
        {"external_id": "file-001", "title": "Planning Notes.md", "summary": "Markdown document metadata.", "payload": {"media_type": "text/markdown", "size_bytes": 2048}},
    ],
}


def list_registry(database_path: Path) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM connector_registry WHERE is_available = 1 ORDER BY connector_type, display_name").fetchall()
    return [registry_dict(row) for row in rows]


def create_connector(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    provider = required_text(payload, "provider")
    connector_type = validate_connector_type(payload.get("connector_type", "EMAIL"))
    registry = get_registry_entry(database_path, provider, connector_type)
    requested = validate_scopes(payload.get("requested_scopes") or DEFAULT_SCOPES[connector_type], registry["supported_permissions"])
    mode = validate_mode(payload.get("synchronization_mode", "IMPORT_ONLY"), registry["synchronization_modes"])
    connector_id = str(uuid.uuid4())
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO connectors(
                  id, user_id, provider, connector_type, display_name, status, authorization_state,
                  requested_scopes, granted_scopes, synchronization_mode, sync_enabled
                ) VALUES (?, ?, ?, ?, ?, 'DISCONNECTED', 'NONE', ?, '[]', ?, 1)
                ON CONFLICT(user_id, provider, connector_type) DO UPDATE SET
                  display_name = excluded.display_name,
                  status = 'DISCONNECTED',
                  authorization_state = 'NONE',
                  requested_scopes = excluded.requested_scopes,
                  synchronization_mode = excluded.synchronization_mode,
                  updated_at = CURRENT_TIMESTAMP
                """,
                (
                    connector_id,
                    context.user["id"],
                    provider,
                    connector_type,
                    str(payload.get("display_name") or registry["display_name"]),
                    json.dumps(requested),
                    mode,
                ),
            )
            row = connection.execute("SELECT id FROM connectors WHERE user_id = ? AND provider = ? AND connector_type = ?", (context.user["id"], provider, connector_type)).fetchone()
            connector_id = row["id"]
            record_health(connection, connector_id, "DISCONNECTED", 0, "Connector registered and awaiting authorization.")
    audit(database_path, "CONNECTOR_CONNECTED", context, request_id, "CONNECTOR", connector_id, {"provider": provider, "status": "registered"})
    activity(database_path, context, "CONNECTOR_CONNECTED", "CONNECTOR", connector_id, f"Registered {provider} connector.")
    return get_connector(database_path, context, connector_id)


def authorize_connector(database_path: Path, context: AuthenticatedContext, connector_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    connector = get_connector(database_path, context, connector_id)
    registry = get_registry_entry(database_path, connector["provider"], connector["connector_type"])
    scopes = validate_scopes(payload.get("scopes") or connector["requested_scopes"], registry["supported_permissions"])
    access_token = secrets.token_urlsafe(24)
    refresh_token = secrets.token_urlsafe(24)
    authorization_id = str(uuid.uuid4())
    expires_at = (utc_now() + timedelta(hours=int(payload.get("expires_in_hours", 12)))).replace(microsecond=0).isoformat()
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO connector_authorizations(
                  id, connector_id, provider, scopes, access_token_ciphertext, refresh_token_ciphertext,
                  provider_account_id, expires_at, refresh_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'VALID')
                """,
                (
                    authorization_id,
                    connector_id,
                    connector["provider"],
                    json.dumps(scopes),
                    encrypt_secret(context.user["id"], connector_id, access_token),
                    encrypt_secret(context.user["id"], connector_id, refresh_token),
                    str(payload.get("provider_account_id", f"{connector['provider']}:local-user")),
                    expires_at,
                ),
            )
            connection.execute(
                "UPDATE connectors SET status = 'CONNECTED', authorization_state = 'AUTHORIZED', granted_scopes = ?, updated_at = ? WHERE id = ?",
                (json.dumps(scopes), iso_now(), connector_id),
            )
            record_health(connection, connector_id, "HEALTHY", 5, "Authorization verified.")
    audit(database_path, "AUTHORIZATION_GRANTED", context, request_id, "CONNECTOR", connector_id, {"scopes": scopes})
    activity(database_path, context, "AUTHORIZATION_GRANTED", "CONNECTOR", connector_id, f"Authorized {connector['display_name']}.")
    return get_connector(database_path, context, connector_id)


def refresh_authorization(database_path: Path, context: AuthenticatedContext, connector_id: str, request_id: str) -> dict[str, Any]:
    connector = get_connector(database_path, context, connector_id)
    authorization = latest_authorization(database_path, connector_id)
    if not authorization or authorization["refresh_status"] == "REVOKED":
        raise AuthError("AUTHORIZATION_REQUIRED", "Connector authorization is not active.", 409)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "UPDATE connector_authorizations SET access_token_ciphertext = ?, expires_at = ?, refresh_status = 'REFRESHED', updated_at = ? WHERE id = ?",
                (
                    encrypt_secret(context.user["id"], connector_id, secrets.token_urlsafe(24)),
                    (utc_now() + timedelta(hours=12)).replace(microsecond=0).isoformat(),
                    iso_now(),
                    authorization["id"],
                ),
            )
            connection.execute("UPDATE connectors SET status = 'CONNECTED', authorization_state = 'AUTHORIZED', updated_at = ? WHERE id = ?", (iso_now(), connector_id))
            record_health(connection, connector_id, "HEALTHY", 7, "Authorization refreshed.")
    audit(database_path, "AUTHORIZATION_GRANTED", context, request_id, "CONNECTOR", connector_id, {"refresh": True})
    return get_connector(database_path, context, connector_id)


def disconnect_connector(database_path: Path, context: AuthenticatedContext, connector_id: str, request_id: str) -> dict[str, Any]:
    connector = get_connector(database_path, context, connector_id)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute("UPDATE connectors SET status = 'DISCONNECTED', authorization_state = 'REVOKED', sync_enabled = 0, disconnected_at = ?, updated_at = ? WHERE id = ?", (iso_now(), iso_now(), connector_id))
            connection.execute("UPDATE connector_authorizations SET refresh_status = 'REVOKED', revoked_at = ?, updated_at = ? WHERE connector_id = ?", (iso_now(), iso_now(), connector_id))
            record_health(connection, connector_id, "DISCONNECTED", 0, "Connector disconnected by user.")
    audit(database_path, "CONNECTOR_DISCONNECTED", context, request_id, "CONNECTOR", connector_id)
    audit(database_path, "AUTHORIZATION_REVOKED", context, request_id, "CONNECTOR", connector_id)
    activity(database_path, context, "CONNECTOR_DISCONNECTED", "CONNECTOR", connector_id, f"Disconnected {connector['display_name']}.")
    return get_connector(database_path, context, connector_id)


def health_check(database_path: Path, context: AuthenticatedContext, connector_id: str, request_id: str) -> dict[str, Any]:
    connector = get_connector(database_path, context, connector_id)
    start = time.perf_counter()
    authorization = latest_authorization(database_path, connector_id)
    status = "DISCONNECTED"
    message = "Connector is disconnected."
    if connector["status"] == "CONNECTED" and authorization:
        if authorization["expires_at"] and parse_iso(authorization["expires_at"]) <= utc_now():
            status = "DEGRADED"
            message = "Authorization expired."
            with closing(connect(database_path)) as connection:
                with connection:
                    connection.execute("UPDATE connectors SET status = 'DEGRADED', authorization_state = 'EXPIRED', updated_at = ? WHERE id = ?", (iso_now(), connector_id))
                    connection.execute("UPDATE connector_authorizations SET refresh_status = 'EXPIRED', updated_at = ? WHERE id = ?", (iso_now(), authorization["id"]))
        else:
            status = "HEALTHY"
            message = "Connector is healthy."
    latency = int((time.perf_counter() - start) * 1000)
    with closing(connect(database_path)) as connection:
        with connection:
            record_health(connection, connector_id, status, latency, message)
    audit(database_path, "CONNECTOR_HEALTH_CHECKED", context, request_id, "CONNECTOR", connector_id, {"status": status})
    return get_connector(database_path, context, connector_id)


def synchronize(database_path: Path, context: AuthenticatedContext, connector_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    connector = get_connector(database_path, context, connector_id)
    if connector["status"] not in {"CONNECTED", "DEGRADED"}:
        raise AuthError("CONNECTOR_NOT_CONNECTED", "Connector must be connected before synchronization.", 409)
    authorization = latest_authorization(database_path, connector_id)
    if not authorization or authorization["refresh_status"] in {"REVOKED", "FAILED"}:
        raise AuthError("AUTHORIZATION_REQUIRED", "Connector authorization is required.", 409)
    if authorization["expires_at"] and parse_iso(authorization["expires_at"]) <= utc_now():
        raise AuthError("AUTHORIZATION_EXPIRED", "Connector authorization expired.", 409)
    mode = validate_mode(payload.get("mode", connector["synchronization_mode"]), connector["registry"]["synchronization_modes"])
    idempotency_key = str(payload.get("idempotency_key") or stable_key(context.user["id"], connector_id, mode, str(payload.get("cursor", "initial"))))
    existing = get_sync_by_key(database_path, context, idempotency_key)
    if existing:
        return existing | {"idempotent_replay": True}
    sync_id = str(uuid.uuid4())
    start = time.perf_counter()
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "INSERT INTO synchronizations(id, connector_id, user_id, mode, status, started_at, idempotency_key, cursor) VALUES (?, ?, ?, ?, 'RUNNING', ?, ?, ?)",
                (sync_id, connector_id, context.user["id"], mode, iso_now(), idempotency_key, text_or_none(payload.get("cursor"))),
            )
            connection.execute("UPDATE connectors SET status = 'SYNCING', updated_at = ? WHERE id = ?", (iso_now(), connector_id))
    try:
        imported, exported, conflicts = sync_provider_records(database_path, context, connector, sync_id, mode)
        status = "CONFLICT" if conflicts else "COMPLETED"
        with closing(connect(database_path)) as connection:
            with connection:
                connection.execute(
                    """
                    UPDATE synchronizations
                    SET status = ?, completed_at = ?, imported_count = ?, exported_count = ?, conflict_count = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (status, iso_now(), imported, exported, conflicts, iso_now(), sync_id),
                )
                connection.execute("UPDATE connectors SET status = ?, last_sync_at = ?, updated_at = ? WHERE id = ?", ("DEGRADED" if conflicts else "CONNECTED", iso_now(), iso_now(), connector_id))
                record_health(connection, connector_id, "DEGRADED" if conflicts else "HEALTHY", int((time.perf_counter() - start) * 1000), "Synchronization completed with conflicts." if conflicts else "Synchronization completed.")
    except Exception as exc:
        with closing(connect(database_path)) as connection:
            with connection:
                connection.execute("UPDATE synchronizations SET status = 'FAILED', completed_at = ?, error_code = ?, error_message = ?, updated_at = ? WHERE id = ?", (iso_now(), error_code(exc), str(exc), iso_now(), sync_id))
                connection.execute("UPDATE connectors SET status = 'ERROR', updated_at = ? WHERE id = ?", (iso_now(), connector_id))
                record_health(connection, connector_id, "ERROR", 0, str(exc))
        audit(database_path, "SYNC_FAILED", context, request_id, "SYNCHRONIZATION", sync_id, {"error_code": error_code(exc)})
        raise
    event = "SYNC_COMPLETED" if conflicts == 0 else "SYNC_FAILED"
    audit(database_path, event, context, request_id, "SYNCHRONIZATION", sync_id, {"imported": imported, "exported": exported, "conflicts": conflicts})
    activity(database_path, context, event, "CONNECTOR", connector_id, f"{connector['display_name']} synchronized.")
    return get_synchronization(database_path, context, sync_id)


def sync_provider_records(database_path: Path, context: AuthenticatedContext, connector: dict[str, Any], sync_id: str, mode: str) -> tuple[int, int, int]:
    imported = 0
    exported = 0
    conflicts = 0
    if mode in {"IMPORT_ONLY", "BIDIRECTIONAL"}:
        for remote in MOCK_REMOTE.get(connector["connector_type"], []):
            checksum = checksum_payload(remote)
            with closing(connect(database_path)) as connection:
                existing = connection.execute(
                    "SELECT * FROM external_links WHERE connector_id = ? AND external_type = ? AND external_id = ?",
                    (connector["id"], connector["connector_type"], remote["external_id"]),
                ).fetchone()
                with connection:
                    if existing and existing["external_checksum"] != checksum:
                        conflicts += 1
                        connection.execute(
                            """
                            INSERT INTO synchronization_conflicts(id, synchronization_id, connector_id, user_id, external_type, external_id, local_snapshot, remote_snapshot, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
                            """,
                            (str(uuid.uuid4()), sync_id, connector["id"], context.user["id"], connector["connector_type"], remote["external_id"], existing["metadata"], json.dumps(remote)),
                        )
                        continue
                    connection.execute(
                        """
                        INSERT INTO external_records(id, connector_id, user_id, provider, record_type, external_id, title, summary, payload)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(connector_id, record_type, external_id) DO UPDATE SET
                          title = excluded.title,
                          summary = excluded.summary,
                          payload = excluded.payload,
                          imported_at = CURRENT_TIMESTAMP
                        """,
                        (str(uuid.uuid4()), connector["id"], context.user["id"], connector["provider"], connector["connector_type"], remote["external_id"], remote["title"], remote["summary"], json.dumps(remote["payload"])),
                    )
                    connection.execute(
                        """
                        INSERT INTO external_links(id, connector_id, user_id, local_type, local_id, external_type, external_id, external_checksum, metadata, sync_id)
                        VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)
                        ON CONFLICT(connector_id, external_type, external_id) DO UPDATE SET
                          external_checksum = excluded.external_checksum,
                          metadata = excluded.metadata,
                          sync_id = excluded.sync_id,
                          last_seen_at = CURRENT_TIMESTAMP,
                          updated_at = CURRENT_TIMESTAMP
                        """,
                        (str(uuid.uuid4()), connector["id"], context.user["id"], connector["connector_type"], connector["connector_type"], remote["external_id"], checksum, json.dumps(remote), sync_id),
                    )
            imported += 1
    if mode in {"EXPORT_ONLY", "BIDIRECTIONAL"}:
        exported = 1
    return imported, exported, conflicts


def resolve_conflict(database_path: Path, context: AuthenticatedContext, conflict_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    resolution = str(payload.get("resolution", "CANCEL")).upper()
    if resolution not in {"LOCAL", "REMOTE", "MERGE", "CANCEL"}:
        raise AuthError("VALIDATION_ERROR", "Unsupported conflict resolution.", 400)
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM synchronization_conflicts WHERE id = ? AND user_id = ?", (conflict_id, context.user["id"])).fetchone()
        if not row:
            raise AuthError("NOT_FOUND", "Synchronization conflict not found.", 404)
        with connection:
            connection.execute("UPDATE synchronization_conflicts SET status = 'RESOLVED', resolution = ?, resolved_at = ? WHERE id = ?", (resolution, iso_now(), conflict_id))
    audit(database_path, "SYNC_COMPLETED", context, request_id, "SYNC_CONFLICT", conflict_id, {"resolution": resolution})
    return get_conflict(database_path, context, conflict_id)


def list_connectors(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM connectors WHERE user_id = ? ORDER BY connector_type, display_name", (context.user["id"],)).fetchall()
    return [connector_dict(database_path, row) for row in rows]


def get_connector(database_path: Path, context: AuthenticatedContext, connector_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM connectors WHERE id = ? AND user_id = ?", (connector_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Connector not found.", 404)
    return connector_dict(database_path, row)


def list_synchronizations(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM synchronizations WHERE user_id = ? ORDER BY created_at DESC LIMIT 100", (context.user["id"],)).fetchall()
    return [sync_dict(row) for row in rows]


def get_synchronization(database_path: Path, context: AuthenticatedContext, sync_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM synchronizations WHERE id = ? AND user_id = ?", (sync_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Synchronization not found.", 404)
    return sync_dict(row)


def list_external_records(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM external_records WHERE user_id = ? ORDER BY imported_at DESC LIMIT 200", (context.user["id"],)).fetchall()
    return [dict(row) | {"payload": json.loads(row["payload"])} for row in rows]


def list_conflicts(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM synchronization_conflicts WHERE user_id = ? ORDER BY created_at DESC LIMIT 100", (context.user["id"],)).fetchall()
    return [conflict_dict(row) for row in rows]


def get_conflict(database_path: Path, context: AuthenticatedContext, conflict_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM synchronization_conflicts WHERE id = ? AND user_id = ?", (conflict_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Synchronization conflict not found.", 404)
    return conflict_dict(row)


def connector_export(database_path: Path, context: AuthenticatedContext) -> dict[str, Any]:
    return {
        "connectors": list_connectors(database_path, context),
        "synchronizations": list_synchronizations(database_path, context),
        "external_records": list_external_records(database_path, context),
        "conflicts": list_conflicts(database_path, context),
    }


def get_sync_by_key(database_path: Path, context: AuthenticatedContext, key: str) -> dict[str, Any] | None:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM synchronizations WHERE user_id = ? AND idempotency_key = ?", (context.user["id"], key)).fetchone()
    return sync_dict(row) if row else None


def latest_authorization(database_path: Path, connector_id: str) -> dict[str, Any] | None:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM connector_authorizations WHERE connector_id = ? ORDER BY created_at DESC LIMIT 1", (connector_id,)).fetchone()
    return authorization_dict(row) if row else None


def connector_dict(database_path: Path, row: Any) -> dict[str, Any]:
    registry = get_registry_entry(database_path, row["provider"], row["connector_type"])
    authorization = latest_authorization(database_path, row["id"])
    with closing(connect(database_path)) as connection:
        health = connection.execute("SELECT * FROM connector_health WHERE connector_id = ? ORDER BY checked_at DESC LIMIT 1", (row["id"],)).fetchone()
    return dict(row) | {
        "sync_enabled": bool(row["sync_enabled"]),
        "requested_scopes": json.loads(row["requested_scopes"]),
        "granted_scopes": json.loads(row["granted_scopes"]),
        "registry": registry,
        "authorization": redact_authorization(authorization) if authorization else None,
        "health": dict(health) if health else None,
    }


def registry_dict(row: Any) -> dict[str, Any]:
    return dict(row) | {
        "capabilities": json.loads(row["capabilities"]),
        "supported_operations": json.loads(row["supported_operations"]),
        "supported_permissions": json.loads(row["supported_permissions"]),
        "synchronization_modes": json.loads(row["synchronization_modes"]),
        "is_available": bool(row["is_available"]),
    }


def authorization_dict(row: Any) -> dict[str, Any]:
    return dict(row) | {"scopes": json.loads(row["scopes"])}


def redact_authorization(authorization: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in authorization.items() if key not in {"access_token_ciphertext", "refresh_token_ciphertext"}} | {"secrets_stored": bool(authorization.get("access_token_ciphertext"))}


def sync_dict(row: Any) -> dict[str, Any]:
    return dict(row)


def conflict_dict(row: Any) -> dict[str, Any]:
    return dict(row) | {"local_snapshot": json.loads(row["local_snapshot"]), "remote_snapshot": json.loads(row["remote_snapshot"])}


def get_registry_entry(database_path: Path, provider: str, connector_type: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM connector_registry WHERE provider = ? AND connector_type = ? AND is_available = 1", (provider, connector_type)).fetchone()
    if not row:
        raise AuthError("CONNECTOR_PROVIDER_UNAVAILABLE", "Connector provider is not available.", 404)
    return registry_dict(row)


def record_health(connection: Any, connector_id: str, status: str, latency_ms: int, message: str) -> None:
    connection.execute("INSERT INTO connector_health(id, connector_id, status, latency_ms, message) VALUES (?, ?, ?, ?, ?)", (str(uuid.uuid4()), connector_id, status, latency_ms, message))


def validate_connector_type(value: Any) -> str:
    connector_type = str(value).strip().upper()
    if connector_type not in {"EMAIL", "CALENDAR", "CONTACTS", "STORAGE", "NOTES", "TASKS", "DOCUMENTS"}:
        raise AuthError("VALIDATION_ERROR", "Unsupported connector type.", 400)
    return connector_type


def validate_scopes(values: list[str], supported: list[str]) -> list[str]:
    scopes = [str(item).strip().upper() for item in values]
    invalid = [item for item in scopes if item not in supported]
    if invalid:
        raise AuthError("SCOPE_NOT_ALLOWED", "Connector requested unsupported permission.", 400)
    return sorted(set(scopes))


def validate_mode(value: Any, supported: list[str]) -> str:
    mode = str(value).strip().upper()
    if mode not in supported:
        raise AuthError("SYNC_MODE_NOT_ALLOWED", "Synchronization mode is not supported.", 400)
    return mode


def encrypt_secret(user_id: str, connector_id: str, secret: str) -> str:
    key = hashlib.sha256(f"{user_id}:{connector_id}:connector-secret".encode("utf-8")).digest()
    raw = secret.encode("utf-8")
    encrypted = bytes(raw[index] ^ key[index % len(key)] for index in range(len(raw)))
    return base64.urlsafe_b64encode(encrypted).decode("ascii")


def checksum_payload(payload: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def stable_key(*parts: str) -> str:
    return hashlib.sha256(":".join(parts).encode("utf-8")).hexdigest()


def required_text(payload: dict[str, Any], key: str) -> str:
    value = str(payload.get(key, "")).strip()
    if not value:
        raise AuthError("VALIDATION_ERROR", f"{key} is required.", 400)
    return value


def text_or_none(value: Any) -> str | None:
    text = str(value).strip() if value is not None else ""
    return text or None


def audit(database_path: Path, event_type: str, context: AuthenticatedContext, request_id: str, resource_type: str, resource_id: str, metadata: dict[str, Any] | None = None) -> None:
    record_audit_event(database_path, event_type, "USER", "SUCCEEDED", request_id, actor_id=context.user["id"], session_id=context.session["id"], resource_type=resource_type, resource_id=resource_id, metadata=metadata)


def activity(database_path: Path, context: AuthenticatedContext, event_type: str, resource_type: str, resource_id: str, summary: str) -> None:
    record_activity(database_path, context.user["id"], event_type, resource_type, resource_id, summary)


def error_code(exc: Exception) -> str:
    return exc.code if isinstance(exc, AuthError) else exc.__class__.__name__
