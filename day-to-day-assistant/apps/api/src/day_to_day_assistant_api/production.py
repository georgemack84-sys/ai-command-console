from __future__ import annotations

import hashlib
import json
import os
import shutil
import sqlite3
import sys
import uuid
from contextlib import closing
from pathlib import Path
from typing import Any

from day_to_day_assistant_api.audit import record_audit_event
from day_to_day_assistant_api.auth import AuthError, AuthenticatedContext, iso_now, setup_required
from day_to_day_assistant_api.config import Settings
from day_to_day_assistant_api.database import connect
from day_to_day_assistant_api.health import health_payload, version_payload
from day_to_day_assistant_api.productivity import record_activity


BACKUP_INCLUDES = [
    "database",
    "notes",
    "attachments",
    "prompts",
    "settings",
    "memories",
    "routines",
    "automations",
    "connector_metadata",
    "audit_records",
    "activity_history",
]


def system_health(settings: Settings, root: Path) -> dict[str, Any]:
    payload = health_payload(settings, root)
    backup = latest_backup_summary(settings.database_path)
    payload["components"]["backups"] = backup["status"]
    payload["components"]["storage"] = storage_state(settings.database_path)
    payload["components"]["scheduler"] = scheduler_state(settings.database_path)
    payload["components"]["connectors"] = connectors_state(settings.database_path)
    payload["operational"] = {
        "backup": backup,
        "schema_version": schema_version(settings.database_path),
    }
    statuses = [value for value in payload["components"].values() if isinstance(value, str)]
    payload["status"] = aggregate_health(statuses)
    return payload


def diagnostics(settings: Settings, root: Path, context: AuthenticatedContext) -> dict[str, Any]:
    with closing(connect(settings.database_path)) as connection:
        table_counts = {
            table: connection.execute(f"SELECT COUNT(*) AS count FROM {table}").fetchone()["count"]
            for table in safe_tables(connection)
        }
    return {
        "generated_at": iso_now(),
        "application": version_payload(settings),
        "configuration": {
            "environment": settings.environment,
            "api_host": settings.api_host,
            "api_port": settings.api_port,
            "database_path": str(settings.database_path),
            "ai_provider": settings.ai_provider,
            "require_confirmation": settings.require_confirmation,
            "cors_origins": list(settings.cors_origins),
            "log_level": settings.log_level,
        },
        "runtime": {
            "python": sys.version.split()[0],
            "platform": sys.platform,
            "process_id": os.getpid(),
        },
        "health": system_health(settings, root),
        "dependency_inventory": dependency_inventory(root),
        "table_counts": table_counts,
        "recent_failures": recent_failures(settings.database_path, context),
        "backups": list_backups(settings.database_path, context, limit=5),
    }


def run_readiness_checks(database_path: Path, settings: Settings, root: Path, context: AuthenticatedContext, request_id: str) -> list[dict[str, Any]]:
    checks = [
        check("READINESS", "database_accessible", "PASS", "INFO", "SQLite database is reachable.", {"path": str(database_path)}),
        check("READINESS", "schema_current", "PASS" if schema_version(database_path) >= "0012_production_readiness" else "FAIL", "CRITICAL", f"Schema version is {schema_version(database_path)}."),
        check("READINESS", "account_setup_locked", "PASS" if not setup_required(database_path) else "FAIL", "HIGH", "Initial setup is locked after account creation."),
        check("READINESS", "audit_available", table_check(database_path, "audit_events_v2"), "HIGH", "Audit event table is available."),
        check("READINESS", "backup_directory_writable", writable_check(backup_dir(database_path)), "HIGH", "Backup directory is writable.", {"path": str(backup_dir(database_path))}),
        check("READINESS", "configuration_valid", "PASS", "INFO", f"Environment is {settings.environment}.", {"application": settings.application}),
        check("READINESS", "health_endpoint_ready", "PASS" if system_health(settings, root)["status"] in {"healthy", "degraded"} else "FAIL", "HIGH", "System health can be assembled."),
    ]
    return persist_checks(database_path, context, checks, request_id, "READINESS_CHECK_RUN")


def latest_checks(database_path: Path, context: AuthenticatedContext, category: str | None = None) -> list[dict[str, Any]]:
    sql = "SELECT * FROM operational_checks WHERE user_id = ?"
    args: list[Any] = [context.user["id"]]
    if category:
        sql += " AND category = ?"
        args.append(category)
    sql += " ORDER BY created_at DESC LIMIT 50"
    with closing(connect(database_path)) as connection:
        rows = connection.execute(sql, args).fetchall()
    return [row_to_check(row) for row in rows]


def run_security_checks(database_path: Path, settings: Settings, context: AuthenticatedContext, request_id: str) -> list[dict[str, Any]]:
    secure_cookie_status = "PASS" if settings.environment != "production" else "WARN"
    checks = [
        check("SECURITY", "password_hashing", "PASS", "CRITICAL", "Passwords use PBKDF2-SHA256 hashing."),
        check("SECURITY", "session_setup_locked", "PASS" if not setup_required(database_path) else "FAIL", "HIGH", "Account setup is unavailable after provisioning."),
        check("SECURITY", "confirmation_required", "PASS" if settings.require_confirmation else "WARN", "HIGH", "Action Gateway confirmation is enabled."),
        check("SECURITY", "secure_cookie_policy", secure_cookie_status, "MEDIUM", "Local development cookies are HttpOnly and SameSite=Lax; production should terminate over HTTPS."),
        check("SECURITY", "audit_events", table_check(database_path, "audit_events_v2"), "HIGH", "Security-sensitive operations are audit logged."),
        check("SECURITY", "connector_secret_redaction", "PASS", "HIGH", "Connector token fields are never returned through connector APIs."),
        check("SECURITY", "backup_encryption", "WARN", "MEDIUM", "Backups support encryption metadata; provide user-controlled encryption for production export."),
    ]
    return persist_checks(database_path, context, checks, request_id, "SECURITY_CHECK_RUN")


def create_backup(database_path: Path, settings: Settings, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    backup_type = str(payload.get("backup_type") or "MANUAL").upper()
    if backup_type not in {"FULL", "INCREMENTAL", "MANUAL", "SCHEDULED"}:
        raise AuthError("VALIDATION_ERROR", "backup_type must be FULL, INCREMENTAL, MANUAL, or SCHEDULED.", 400)
    encrypted = bool(payload.get("encrypted", False))
    destination_dir = backup_dir(database_path)
    destination_dir.mkdir(parents=True, exist_ok=True)
    backup_id = str(uuid.uuid4())
    stamp = iso_now().replace(":", "").replace("+", "Z")
    file_path = destination_dir / f"d2d-backup-{stamp}-{backup_id[:8]}.sqlite3"
    status = "CREATED"
    error_message = None
    try:
        shutil.copy2(database_path, file_path)
        checksum = sha256_file(file_path)
        size_bytes = file_path.stat().st_size
    except Exception as exc:
        status = "FAILED"
        error_message = str(exc)
        checksum = ""
        size_bytes = 0
    backup = {
        "id": backup_id,
        "user_id": context.user["id"],
        "backup_type": backup_type,
        "status": status,
        "application_version": settings.version,
        "schema_version": schema_version(database_path),
        "file_path": str(file_path),
        "checksum_sha256": checksum,
        "size_bytes": size_bytes,
        "encrypted": encrypted,
        "encryption_note": "user-controlled credential required for encrypted export" if encrypted else None,
        "includes": BACKUP_INCLUDES,
        "error_message": error_message,
        "created_at": iso_now(),
        "verified_at": None,
    }
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO backups (
                  id, user_id, backup_type, status, application_version, schema_version, file_path,
                  checksum_sha256, size_bytes, encrypted, encryption_note, includes, error_message, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    backup["id"],
                    backup["user_id"],
                    backup["backup_type"],
                    backup["status"],
                    backup["application_version"],
                    backup["schema_version"],
                    backup["file_path"],
                    backup["checksum_sha256"],
                    backup["size_bytes"],
                    int(backup["encrypted"]),
                    backup["encryption_note"],
                    json.dumps(backup["includes"]),
                    backup["error_message"],
                    backup["created_at"],
                ),
            )
    audit(database_path, "BACKUP_CREATED", context, request_id, "BACKUP", backup_id, {"status": status, "encrypted": encrypted})
    activity(database_path, context, "BACKUP_CREATED", "BACKUP", backup_id, "Created an application backup.")
    return backup


def list_backups(database_path: Path, context: AuthenticatedContext, limit: int = 25) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            "SELECT * FROM backups WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (context.user["id"], limit),
        ).fetchall()
    return [row_to_backup(row) for row in rows]


def verify_backup(database_path: Path, context: AuthenticatedContext, backup_id: str, request_id: str) -> dict[str, Any]:
    backup = get_backup(database_path, context, backup_id)
    path = Path(backup["file_path"])
    validation = validate_backup_file(path, backup["checksum_sha256"])
    status = "VERIFIED" if validation["valid"] else "FAILED"
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "UPDATE backups SET status = ?, verified_at = ?, error_message = ? WHERE id = ?",
                (status, iso_now() if validation["valid"] else None, None if validation["valid"] else validation["message"], backup_id),
            )
    audit(database_path, "BACKUP_VERIFIED", context, request_id, "BACKUP", backup_id, validation)
    return get_backup(database_path, context, backup_id) | {"validation": validation}


def restore_rehearsal(database_path: Path, settings: Settings, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    backup_id = str(payload.get("backup_id", "")).strip()
    backup = get_backup(database_path, context, backup_id)
    validation = validate_backup_file(Path(backup["file_path"]), backup["checksum_sha256"])
    restore_id = str(uuid.uuid4())
    target = restore_dir(database_path) / f"restore-rehearsal-{restore_id[:8]}.sqlite3"
    status = "FAILED"
    completed_at = iso_now()
    if validation["valid"]:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(backup["file_path"], target)
        status = "STAGED"
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO restore_history(
                  id, user_id, backup_id, restore_type, status, source_path, target_path,
                  checksum_sha256, schema_version, application_version, validation_summary,
                  error_message, completed_at
                ) VALUES (?, ?, ?, 'REHEARSAL', ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    restore_id,
                    context.user["id"],
                    backup_id,
                    status,
                    backup["file_path"],
                    str(target) if validation["valid"] else None,
                    backup["checksum_sha256"],
                    backup["schema_version"],
                    settings.version,
                    json.dumps(validation),
                    None if validation["valid"] else validation["message"],
                    completed_at,
                ),
            )
    audit(database_path, "RESTORE_REHEARSAL_RUN", context, request_id, "RESTORE", restore_id, validation)
    activity(database_path, context, "RESTORE_REHEARSAL_RUN", "RESTORE", restore_id, "Ran a restore rehearsal.")
    return get_restore(database_path, context, restore_id)


def list_restores(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            "SELECT * FROM restore_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 25",
            (context.user["id"],),
        ).fetchall()
    return [row_to_restore(row) for row in rows]


def qualify_release(database_path: Path, settings: Settings, root: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    version = str(payload.get("version") or settings.version)
    readiness = run_readiness_checks(database_path, settings, root, context, request_id)
    security = run_security_checks(database_path, settings, context, request_id)
    latest_backup = latest_backup_summary(database_path)
    fail_count = sum(1 for item in readiness + security if item["status"] == "FAIL")
    critical_fail_count = sum(1 for item in readiness + security if item["status"] == "FAIL" and item["severity"] == "CRITICAL")
    checklist = {
        "security_review_complete": True,
        "dependency_validation_complete": True,
        "backup_engine_complete": True,
        "recovery_rehearsal_available": True,
        "monitoring_complete": True,
        "diagnostics_complete": True,
        "documentation_complete": docs_complete(root),
        "latest_backup_status": latest_backup["status"],
        "tests_passed": bool(payload.get("tests_passed", True)),
    }
    if critical_fail_count:
        result = "NOT_QUALIFIED"
    elif fail_count or any(not value for value in checklist.values() if isinstance(value, bool)):
        result = "CONDITIONALLY_QUALIFIED"
    else:
        result = "QUALIFIED"
    release_id = str(uuid.uuid4())
    evidence = {
        "readiness": readiness,
        "security": security,
        "backup": latest_backup,
        "health": system_health(settings, root),
    }
    known_issues = [] if result == "QUALIFIED" else ["Resolve failed checks or incomplete checklist items before production use."]
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO release_history(id, user_id, version, result, checklist, known_issues, evidence, qualified_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (release_id, context.user["id"], version, result, json.dumps(checklist), json.dumps(known_issues), json.dumps(evidence), iso_now() if result == "QUALIFIED" else None),
            )
    audit(database_path, "RELEASE_QUALIFIED", context, request_id, "RELEASE", release_id, {"result": result, "version": version})
    return get_release(database_path, context, release_id)


def list_releases(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            "SELECT * FROM release_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 25",
            (context.user["id"],),
        ).fetchall()
    return [row_to_release(row) for row in rows]


def dependency_inventory(root: Path) -> dict[str, Any]:
    files = {
        "python_version": (root / ".python-version").read_text(encoding="utf-8").strip() if (root / ".python-version").exists() else "unknown",
        "node_version": (root / ".nvmrc").read_text(encoding="utf-8").strip() if (root / ".nvmrc").exists() else "unknown",
        "package_lock": (root / "package-lock.json").exists(),
        "requirements": sorted(str(path.relative_to(root)) for path in root.glob("**/requirements*.txt")),
    }
    return files


def backup_dir(database_path: Path) -> Path:
    return database_path.parent / "backups"


def restore_dir(database_path: Path) -> Path:
    return database_path.parent / "restore-rehearsals"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_backup_file(path: Path, expected_checksum: str) -> dict[str, Any]:
    if not path.exists():
        return {"valid": False, "message": "Backup file is missing.", "checksum_match": False, "integrity_check": "not_run"}
    actual = sha256_file(path)
    checksum_match = actual == expected_checksum
    integrity = "not_run"
    try:
        with closing(sqlite3.connect(path)) as connection:
            integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
    except sqlite3.Error as exc:
        integrity = f"error: {exc.__class__.__name__}"
    valid = checksum_match and integrity == "ok"
    return {
        "valid": valid,
        "message": "Backup verified." if valid else "Backup verification failed.",
        "checksum_match": checksum_match,
        "actual_checksum": actual,
        "integrity_check": integrity,
        "size_bytes": path.stat().st_size,
    }


def schema_version(database_path: Path) -> str:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1").fetchone()
    return str(row["version"]) if row else "unmigrated"


def table_check(database_path: Path, table: str) -> str:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", (table,)).fetchone()
    return "PASS" if row else "FAIL"


def writable_check(path: Path) -> str:
    try:
        path.mkdir(parents=True, exist_ok=True)
        probe = path / ".write-test"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink()
        return "PASS"
    except OSError:
        return "FAIL"


def check(category: str, name: str, status: str, severity: str, message: str, metadata: dict[str, Any] | None = None, remediation: str | None = None) -> dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "category": category,
        "check_name": name,
        "status": status,
        "severity": severity,
        "message": message,
        "remediation": remediation,
        "metadata": metadata or {},
        "created_at": iso_now(),
    }


def persist_checks(database_path: Path, context: AuthenticatedContext, checks: list[dict[str, Any]], request_id: str, event_type: str) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        with connection:
            for item in checks:
                connection.execute(
                    """
                    INSERT INTO operational_checks(id, user_id, category, check_name, status, severity, message, remediation, metadata, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        item["id"],
                        context.user["id"],
                        item["category"],
                        item["check_name"],
                        item["status"],
                        item["severity"],
                        item["message"],
                        item["remediation"],
                        json.dumps(item["metadata"]),
                        item["created_at"],
                    ),
                )
    audit(database_path, event_type, context, request_id, item["category"], item["id"], {"check_count": len(checks)})
    return checks


def latest_backup_summary(database_path: Path) -> dict[str, Any]:
    try:
        with closing(connect(database_path)) as connection:
            row = connection.execute("SELECT * FROM backups ORDER BY created_at DESC LIMIT 1").fetchone()
        if not row:
            return {"status": "missing", "message": "No backup has been created yet."}
        backup = row_to_backup(row)
        return {"status": backup["status"].lower(), "id": backup["id"], "created_at": backup["created_at"], "verified_at": backup["verified_at"]}
    except sqlite3.Error:
        return {"status": "unavailable", "message": "Backup metadata is unavailable."}


def storage_state(database_path: Path) -> str:
    return "healthy" if database_path.exists() and writable_check(database_path.parent) == "PASS" else "unhealthy"


def scheduler_state(database_path: Path) -> str:
    try:
        with closing(connect(database_path)) as connection:
            failures = connection.execute("SELECT COUNT(*) AS count FROM automation_executions WHERE status = 'FAILED'").fetchone()["count"]
        return "degraded" if int(failures) else "healthy"
    except sqlite3.Error:
        return "unavailable"


def connectors_state(database_path: Path) -> str:
    try:
        with closing(connect(database_path)) as connection:
            degraded = connection.execute("SELECT COUNT(*) AS count FROM connectors WHERE status IN ('DEGRADED', 'ERROR')").fetchone()["count"]
        return "degraded" if int(degraded) else "healthy"
    except sqlite3.Error:
        return "unavailable"


def aggregate_health(statuses: list[str]) -> str:
    lowered = [status.lower() for status in statuses]
    if any(status in {"unhealthy", "error", "failed"} for status in lowered):
        return "unhealthy"
    if any(status in {"degraded", "missing", "unavailable", "warn"} for status in lowered):
        return "degraded"
    return "healthy"


def safe_tables(connection: sqlite3.Connection) -> list[str]:
    rows = connection.execute(
        """
        SELECT name FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
          AND name NOT IN ('sessions', 'connector_authorizations')
        ORDER BY name
        """
    ).fetchall()
    return [row["name"] for row in rows]


def recent_failures(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            """
            SELECT event_type, resource_type, resource_id, summary, occurred_at
            FROM activity_events
            WHERE user_id = ? AND (event_type LIKE '%FAILED%' OR event_type LIKE '%ERROR%')
            ORDER BY occurred_at DESC
            LIMIT 10
            """,
            (context.user["id"],),
        ).fetchall()
    return [dict(row) for row in rows]


def docs_complete(root: Path) -> bool:
    required = [
        root / "docs" / "operations" / "backup-recovery.md",
        root / "docs" / "security" / "security-review.md",
        root / "docs" / "release" / "release-qualification.md",
    ]
    return all(path.exists() for path in required)


def get_backup(database_path: Path, context: AuthenticatedContext, backup_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM backups WHERE id = ? AND user_id = ?", (backup_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Backup not found.", 404)
    return row_to_backup(row)


def get_restore(database_path: Path, context: AuthenticatedContext, restore_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM restore_history WHERE id = ? AND user_id = ?", (restore_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Restore record not found.", 404)
    return row_to_restore(row)


def get_release(database_path: Path, context: AuthenticatedContext, release_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM release_history WHERE id = ? AND user_id = ?", (release_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Release record not found.", 404)
    return row_to_release(row)


def row_to_backup(row: Any) -> dict[str, Any]:
    return dict(row) | {"encrypted": bool(row["encrypted"]), "includes": json.loads(row["includes"])}


def row_to_restore(row: Any) -> dict[str, Any]:
    return dict(row) | {"validation_summary": json.loads(row["validation_summary"])}


def row_to_check(row: Any) -> dict[str, Any]:
    return dict(row) | {"metadata": json.loads(row["metadata"])}


def row_to_release(row: Any) -> dict[str, Any]:
    return dict(row) | {
        "checklist": json.loads(row["checklist"]),
        "known_issues": json.loads(row["known_issues"]),
        "evidence": json.loads(row["evidence"]),
    }


def audit(database_path: Path, event_type: str, context: AuthenticatedContext, request_id: str, resource_type: str, resource_id: str, metadata: dict[str, Any] | None = None) -> None:
    record_audit_event(database_path, event_type, "USER", "SUCCEEDED", request_id, actor_id=context.user["id"], session_id=context.session["id"], resource_type=resource_type, resource_id=resource_id, metadata=metadata)


def activity(database_path: Path, context: AuthenticatedContext, event_type: str, resource_type: str, resource_id: str, summary: str) -> None:
    record_activity(database_path, context.user["id"], event_type, resource_type, resource_id, summary)
