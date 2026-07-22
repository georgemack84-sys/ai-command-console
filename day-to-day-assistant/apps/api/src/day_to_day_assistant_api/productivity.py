from __future__ import annotations

import json
import uuid
from contextlib import closing
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from day_to_day_assistant_api.audit import record_audit_event
from day_to_day_assistant_api.auth import AuthError, AuthenticatedContext
from day_to_day_assistant_api.database import connect


TASK_STATUSES = {"INBOX", "PLANNED", "IN_PROGRESS", "WAITING", "BLOCKED", "COMPLETED", "CANCELLED", "ARCHIVED"}
ACTIVE_TASK_STATUSES = {"INBOX", "PLANNED", "IN_PROGRESS", "WAITING", "BLOCKED"}
PRIORITIES = {"NONE", "LOW", "MEDIUM", "HIGH", "URGENT"}
FOLLOWUP_STATUSES = {"OPEN", "WAITING", "RESOLVED", "CANCELLED", "ARCHIVED"}

TASK_TRANSITIONS = {
    "INBOX": {"PLANNED", "IN_PROGRESS", "CANCELLED", "ARCHIVED"},
    "PLANNED": {"IN_PROGRESS", "WAITING", "BLOCKED", "COMPLETED", "CANCELLED", "ARCHIVED"},
    "IN_PROGRESS": {"PLANNED", "WAITING", "BLOCKED", "COMPLETED", "CANCELLED", "ARCHIVED"},
    "WAITING": {"PLANNED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED", "ARCHIVED"},
    "BLOCKED": {"PLANNED", "IN_PROGRESS", "WAITING", "COMPLETED", "CANCELLED", "ARCHIVED"},
    "COMPLETED": {"PLANNED", "ARCHIVED"},
    "CANCELLED": {"PLANNED", "ARCHIVED"},
    "ARCHIVED": {"INBOX", "PLANNED", "IN_PROGRESS", "WAITING", "BLOCKED", "COMPLETED", "CANCELLED"},
}

PRIORITY_RANK = {"URGENT": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "NONE": 4}


def utc_now() -> datetime:
    return datetime.now(UTC)


def iso_now() -> str:
    return utc_now().replace(microsecond=0).isoformat()


def parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def create_task_list(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    name = required_text(payload, "name")
    list_id = str(uuid.uuid4())
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "INSERT INTO task_lists(id, user_id, name, description, position) VALUES (?, ?, ?, ?, ?)",
                (list_id, context.user["id"], name, text_or_none(payload.get("description")), int(payload.get("position", 0))),
            )
    record_activity(database_path, context.user["id"], "TASK_LIST_CREATED", "TASK_LIST", list_id, f"Created list {name}")
    audit(database_path, "TASK_LIST_CREATED", context, request_id, "TASK_LIST", list_id)
    return get_task_list(database_path, context, list_id)


def ensure_default_task_list(database_path: Path, context: AuthenticatedContext) -> str:
    with closing(connect(database_path)) as connection:
        existing = connection.execute(
            "SELECT id FROM task_lists WHERE user_id = ? AND is_default = 1 AND is_archived = 0",
            (context.user["id"],),
        ).fetchone()
        if existing:
            return str(existing["id"])
        list_id = str(uuid.uuid4())
        with connection:
            connection.execute(
                """
                INSERT INTO task_lists(id, user_id, name, description, position, is_default)
                VALUES (?, ?, 'Inbox', 'Default capture list', 0, 1)
                """,
                (list_id, context.user["id"]),
            )
        return list_id


def list_task_lists(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    ensure_default_task_list(database_path, context)
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            "SELECT * FROM task_lists WHERE user_id = ? AND is_archived = 0 ORDER BY is_default DESC, position, name",
            (context.user["id"],),
        ).fetchall()
    return [dict(row) for row in rows]


def get_task_list(database_path: Path, context: AuthenticatedContext, list_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute(
            "SELECT * FROM task_lists WHERE id = ? AND user_id = ?",
            (list_id, context.user["id"]),
        ).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Task list not found.", 404)
    return dict(row)


def update_task_list(database_path: Path, context: AuthenticatedContext, list_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    current = get_task_list(database_path, context, list_id)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "UPDATE task_lists SET name = ?, description = ?, position = ?, updated_at = ? WHERE id = ? AND user_id = ?",
                (
                    required_text(payload, "name") if "name" in payload else current["name"],
                    text_or_none(payload.get("description", current["description"])),
                    int(payload.get("position", current["position"])),
                    iso_now(),
                    list_id,
                    context.user["id"],
                ),
            )
    audit(database_path, "TASK_LIST_UPDATED", context, request_id, "TASK_LIST", list_id)
    return get_task_list(database_path, context, list_id)


def archive_task_list(database_path: Path, context: AuthenticatedContext, list_id: str, request_id: str) -> dict[str, Any]:
    task_list = get_task_list(database_path, context, list_id)
    if task_list["is_default"]:
        raise AuthError("VALIDATION_ERROR", "The default Inbox list cannot be archived.", 400)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "UPDATE task_lists SET is_archived = 1, updated_at = ? WHERE id = ? AND user_id = ?",
                (iso_now(), list_id, context.user["id"]),
            )
    audit(database_path, "TASK_LIST_ARCHIVED", context, request_id, "TASK_LIST", list_id)
    return get_task_list(database_path, context, list_id)


def create_project(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    project_id = str(uuid.uuid4())
    name = required_text(payload, "name")
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO projects(id, user_id, name, description, status, start_date, target_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    project_id,
                    context.user["id"],
                    name,
                    text_or_none(payload.get("description")),
                    str(payload.get("status", "ACTIVE")),
                    text_or_none(payload.get("start_date")),
                    text_or_none(payload.get("target_date")),
                ),
            )
    record_activity(database_path, context.user["id"], "PROJECT_CREATED", "PROJECT", project_id, f"Created project {name}")
    audit(database_path, "PROJECT_CREATED", context, request_id, "PROJECT", project_id)
    return get_project(database_path, context, project_id)


def list_projects(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            "SELECT * FROM projects WHERE user_id = ? AND archived_at IS NULL ORDER BY created_at DESC",
            (context.user["id"],),
        ).fetchall()
    return [dict(row) for row in rows]


def get_project(database_path: Path, context: AuthenticatedContext, project_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute(
            "SELECT * FROM projects WHERE id = ? AND user_id = ?",
            (project_id, context.user["id"]),
        ).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Project not found.", 404)
    return dict(row)


def update_project(database_path: Path, context: AuthenticatedContext, project_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    current = get_project(database_path, context, project_id)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                UPDATE projects
                SET name = ?, description = ?, status = ?, start_date = ?, target_date = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (
                    str(payload.get("name", current["name"])).strip(),
                    text_or_none(payload.get("description", current["description"])),
                    str(payload.get("status", current["status"])),
                    text_or_none(payload.get("start_date", current["start_date"])),
                    text_or_none(payload.get("target_date", current["target_date"])),
                    iso_now(),
                    project_id,
                    context.user["id"],
                ),
            )
    audit(database_path, "PROJECT_UPDATED", context, request_id, "PROJECT", project_id)
    return get_project(database_path, context, project_id)


def archive_project(database_path: Path, context: AuthenticatedContext, project_id: str, request_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "UPDATE projects SET status = 'ARCHIVED', archived_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
                (iso_now(), iso_now(), project_id, context.user["id"]),
            )
    audit(database_path, "PROJECT_ARCHIVED", context, request_id, "PROJECT", project_id)
    return get_project(database_path, context, project_id)


def create_task(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    task_id = str(uuid.uuid4())
    task_list_id = str(payload.get("task_list_id") or ensure_default_task_list(database_path, context))
    title = required_text(payload, "title")
    priority = validate_priority(str(payload.get("priority", "NONE")))
    status = validate_status(str(payload.get("status", "INBOX")))
    validate_task_dates(payload)
    recurrence_frequency = payload.get("recurrence_frequency")
    recurrence_rule_id = str(uuid.uuid4()) if recurrence_frequency else None
    recurrence_series_id = str(uuid.uuid4()) if recurrence_frequency else None
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO tasks (
                  id, user_id, title, description, status, priority, task_list_id, project_id,
                  due_at, start_at, estimated_minutes, recurrence_rule_id, recurrence_series_id,
                  occurrence_number, scheduled_for
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    task_id,
                    context.user["id"],
                    title,
                    text_or_none(payload.get("description")),
                    status,
                    priority,
                    task_list_id,
                    text_or_none(payload.get("project_id")),
                    text_or_none(payload.get("due_at")),
                    text_or_none(payload.get("start_at")),
                    int(payload["estimated_minutes"]) if payload.get("estimated_minutes") else None,
                    recurrence_rule_id,
                    recurrence_series_id,
                    1 if recurrence_frequency else None,
                    text_or_none(payload.get("due_at")),
                ),
            )
            if recurrence_rule_id:
                connection.execute(
                    """
                    INSERT INTO task_recurrence_rules(id, task_id, frequency, interval, generation_policy, timezone)
                    VALUES (?, ?, ?, ?, 'ON_COMPLETION', ?)
                    """,
                    (
                        recurrence_rule_id,
                        task_id,
                        str(recurrence_frequency).upper(),
                        int(payload.get("recurrence_interval", 1)),
                        context.user["timezone"],
                    ),
                )
            insert_task_history(connection, task_id, "TASK_CREATED", context.user["id"], None, status, ["title"])
    record_activity(database_path, context.user["id"], "TASK_CREATED", "TASK", task_id, f"Created task {title}")
    audit(database_path, "TASK_CREATED", context, request_id, "TASK", task_id)
    return get_task(database_path, context, task_id)


def list_tasks(database_path: Path, context: AuthenticatedContext, query: dict[str, str] | None = None) -> list[dict[str, Any]]:
    query = query or {}
    sql = "SELECT * FROM tasks WHERE user_id = ?"
    args: list[Any] = [context.user["id"]]
    if query.get("include_archived") != "true":
        sql += " AND status != 'ARCHIVED'"
    if query.get("status"):
        sql += " AND status = ?"
        args.append(query["status"])
    if query.get("search"):
        sql += " AND (lower(title) LIKE ? OR lower(COALESCE(description, '')) LIKE ?)"
        term = f"%{query['search'].lower()}%"
        args.extend([term, term])
    sql += " ORDER BY due_at IS NULL, due_at, created_at DESC LIMIT 100"
    with closing(connect(database_path)) as connection:
        rows = connection.execute(sql, args).fetchall()
    tasks = [task_with_classification(row) for row in rows]
    return sorted(tasks, key=task_sort_key)


def get_task(database_path: Path, context: AuthenticatedContext, task_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM tasks WHERE id = ? AND user_id = ?", (task_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Task not found.", 404)
    return task_with_classification(row)


def update_task(database_path: Path, context: AuthenticatedContext, task_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    current = get_task(database_path, context, task_id)
    validate_task_dates(payload)
    expected_version = payload.get("version")
    if expected_version is not None and int(expected_version) != int(current["version"]):
        raise AuthError("STALE_RECORD", "Task was updated by another request.", 409)
    changed = [key for key in payload if key in {"title", "description", "priority", "due_at", "start_at", "estimated_minutes", "task_list_id", "project_id", "deferred_until"}]
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                UPDATE tasks
                SET title = ?, description = ?, priority = ?, due_at = ?, start_at = ?, estimated_minutes = ?,
                    task_list_id = ?, project_id = ?, deferred_until = ?, version = version + 1, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (
                    str(payload.get("title", current["title"])).strip(),
                    text_or_none(payload.get("description", current["description"])),
                    validate_priority(str(payload.get("priority", current["priority"]))),
                    text_or_none(payload.get("due_at", current["due_at"])),
                    text_or_none(payload.get("start_at", current["start_at"])),
                    int(payload.get("estimated_minutes", current["estimated_minutes"])) if payload.get("estimated_minutes", current["estimated_minutes"]) else None,
                    text_or_none(payload.get("task_list_id", current["task_list_id"])),
                    text_or_none(payload.get("project_id", current["project_id"])),
                    text_or_none(payload.get("deferred_until", current["deferred_until"])),
                    iso_now(),
                    task_id,
                    context.user["id"],
                ),
            )
            insert_task_history(connection, task_id, "TASK_UPDATED", context.user["id"], current["status"], current["status"], changed)
    record_activity(database_path, context.user["id"], "TASK_UPDATED", "TASK", task_id, f"Updated task {current['title']}")
    audit(database_path, "TASK_UPDATED", context, request_id, "TASK", task_id, {"changed_fields": changed})
    return get_task(database_path, context, task_id)


def transition_task(database_path: Path, context: AuthenticatedContext, task_id: str, target_status: str, request_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = payload or {}
    current = get_task(database_path, context, task_id)
    target_status = validate_status(target_status)
    if target_status not in TASK_TRANSITIONS[current["status"]]:
        raise AuthError("INVALID_TASK_TRANSITION", f"Cannot move task from {current['status']} to {target_status}.", 400)
    now = iso_now()
    completed_at = now if target_status == "COMPLETED" else None if current["status"] == "COMPLETED" else current["completed_at"]
    cancelled_at = now if target_status == "CANCELLED" else None if current["status"] == "CANCELLED" else current["cancelled_at"]
    archived_at = now if target_status == "ARCHIVED" else None if current["status"] == "ARCHIVED" else current["archived_at"]
    previous_status = current["status"] if target_status == "ARCHIVED" else current["previous_status"]
    if current["status"] == "ARCHIVED" and target_status != "ARCHIVED":
        previous_status = None
        archived_at = None
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                UPDATE tasks
                SET status = ?, previous_status = ?, completed_at = ?, cancelled_at = ?, archived_at = ?,
                    deferred_until = ?, version = version + 1, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (
                    target_status,
                    previous_status,
                    completed_at,
                    cancelled_at,
                    archived_at,
                    text_or_none(payload.get("deferred_until", current["deferred_until"])),
                    now,
                    task_id,
                    context.user["id"],
                ),
            )
            event_type = task_event_for_status(target_status, current["status"])
            insert_task_history(connection, task_id, event_type, context.user["id"], current["status"], target_status, ["status"])
    if target_status == "COMPLETED":
        generate_next_recurrence(database_path, context, task_id, request_id)
    record_activity(database_path, context.user["id"], task_event_for_status(target_status, current["status"]), "TASK", task_id, f"{target_status.title()} task {current['title']}")
    audit(database_path, task_event_for_status(target_status, current["status"]), context, request_id, "TASK", task_id)
    return get_task(database_path, context, task_id)


def delete_task(database_path: Path, context: AuthenticatedContext, task_id: str, request_id: str, permanent: bool = False) -> dict[str, Any]:
    if not permanent:
        return transition_task(database_path, context, task_id, "ARCHIVED", request_id)
    current = get_task(database_path, context, task_id)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", (task_id, context.user["id"]))
    audit(database_path, "TASK_DELETED", context, request_id, "TASK", task_id)
    return current


def task_history(database_path: Path, context: AuthenticatedContext, task_id: str) -> list[dict[str, Any]]:
    get_task(database_path, context, task_id)
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM task_history WHERE task_id = ? ORDER BY occurred_at DESC", (task_id,)).fetchall()
    return [dict(row) | {"changed_fields": json.loads(row["changed_fields"])} for row in rows]


def create_reminder(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    reminder_id = str(uuid.uuid4())
    job_id = str(uuid.uuid4())
    scheduled_at = required_text(payload, "scheduled_at")
    title = required_text(payload, "title")
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO reminders(id, user_id, title, message, related_type, related_id, scheduled_at, timezone, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')
                """,
                (
                    reminder_id,
                    context.user["id"],
                    title,
                    text_or_none(payload.get("message")),
                    str(payload.get("related_type", "STANDALONE")),
                    text_or_none(payload.get("related_id")),
                    scheduled_at,
                    str(payload.get("timezone", context.user["timezone"])),
                ),
            )
            connection.execute(
                "INSERT INTO reminder_jobs(id, reminder_id, due_at, status, idempotency_key) VALUES (?, ?, ?, 'PENDING', ?)",
                (job_id, reminder_id, scheduled_at, f"{reminder_id}:{scheduled_at}"),
            )
    record_activity(database_path, context.user["id"], "REMINDER_CREATED", "REMINDER", reminder_id, f"Created reminder {title}")
    audit(database_path, "REMINDER_CREATED", context, request_id, "REMINDER", reminder_id)
    return get_reminder(database_path, context, reminder_id)


def process_due_reminders(database_path: Path, context: AuthenticatedContext) -> int:
    now = iso_now()
    delivered = 0
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            """
            SELECT r.*, j.id AS job_id, j.due_at AS job_due_at
            FROM reminders r
            JOIN reminder_jobs j ON j.reminder_id = r.id
            WHERE r.user_id = ? AND j.status = 'PENDING' AND j.due_at <= ?
              AND r.status IN ('SCHEDULED', 'SNOOZED', 'DUE')
            ORDER BY j.due_at
            LIMIT 25
            """,
            (context.user["id"], now),
        ).fetchall()
        with connection:
            for row in rows:
                late = parse_time(row["job_due_at"]) < utc_now() - timedelta(minutes=1)
                notification_id = str(uuid.uuid4())
                delivery_id = str(uuid.uuid4())
                connection.execute(
                    "UPDATE reminder_jobs SET status = 'SUCCEEDED', completed_at = ?, attempt_count = attempt_count + 1 WHERE id = ?",
                    (now, row["job_id"]),
                )
                connection.execute(
                    "UPDATE reminders SET status = 'DELIVERED', last_delivery_at = ?, updated_at = ? WHERE id = ?",
                    (now, now, row["id"]),
                )
                connection.execute(
                    """
                    INSERT OR IGNORE INTO notifications(id, user_id, type, title, message, related_type, related_id, status)
                    VALUES (?, ?, 'REMINDER', ?, ?, ?, ?, 'UNREAD')
                    """,
                    (notification_id, context.user["id"], row["title"], row["message"], "REMINDER", row["id"]),
                )
                connection.execute(
                    "INSERT INTO reminder_deliveries(id, reminder_id, job_id, outcome, late, message) VALUES (?, ?, ?, 'SUCCEEDED', ?, ?)",
                    (delivery_id, row["id"], row["job_id"], 1 if late else 0, "Delivered in app"),
                )
                delivered += 1
    return delivered


def list_reminders(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    process_due_reminders(database_path, context)
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM reminders WHERE user_id = ? ORDER BY scheduled_at", (context.user["id"],)).fetchall()
    return [dict(row) for row in rows]


def get_reminder(database_path: Path, context: AuthenticatedContext, reminder_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM reminders WHERE id = ? AND user_id = ?", (reminder_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Reminder not found.", 404)
    return dict(row)


def reminder_action(database_path: Path, context: AuthenticatedContext, reminder_id: str, action: str, request_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = payload or {}
    reminder = get_reminder(database_path, context, reminder_id)
    now = iso_now()
    with closing(connect(database_path)) as connection:
        with connection:
            if action == "acknowledge":
                connection.execute("UPDATE reminders SET status = 'ACKNOWLEDGED', acknowledged_at = ?, updated_at = ? WHERE id = ?", (now, now, reminder_id))
            elif action == "complete":
                connection.execute("UPDATE reminders SET status = 'COMPLETED', completed_at = ?, updated_at = ? WHERE id = ?", (now, now, reminder_id))
            elif action == "cancel":
                connection.execute("UPDATE reminders SET status = 'CANCELLED', cancelled_at = ?, updated_at = ? WHERE id = ?", (now, now, reminder_id))
                connection.execute("UPDATE reminder_jobs SET status = 'CANCELLED' WHERE reminder_id = ? AND status = 'PENDING'", (reminder_id,))
            elif action == "snooze":
                snoozed_until = str(payload.get("snoozed_until") or (utc_now() + timedelta(minutes=10)).replace(microsecond=0).isoformat())
                job_id = str(uuid.uuid4())
                connection.execute("UPDATE reminder_jobs SET status = 'CANCELLED' WHERE reminder_id = ? AND status = 'PENDING'", (reminder_id,))
                connection.execute("UPDATE reminders SET status = 'SNOOZED', snoozed_until = ?, scheduled_at = ?, updated_at = ? WHERE id = ?", (snoozed_until, snoozed_until, now, reminder_id))
                connection.execute("INSERT INTO reminder_jobs(id, reminder_id, due_at, status, idempotency_key) VALUES (?, ?, ?, 'PENDING', ?)", (job_id, reminder_id, snoozed_until, f"{reminder_id}:{snoozed_until}"))
            else:
                raise AuthError("VALIDATION_ERROR", "Unsupported reminder action.", 400)
    audit(database_path, f"REMINDER_{action.upper()}", context, request_id, "REMINDER", reminder_id)
    record_activity(database_path, context.user["id"], f"REMINDER_{action.upper()}", "REMINDER", reminder_id, f"{action.title()} reminder {reminder['title']}")
    return get_reminder(database_path, context, reminder_id)


def reminder_deliveries(database_path: Path, context: AuthenticatedContext, reminder_id: str) -> list[dict[str, Any]]:
    get_reminder(database_path, context, reminder_id)
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM reminder_deliveries WHERE reminder_id = ? ORDER BY delivered_at DESC", (reminder_id,)).fetchall()
    return [dict(row) for row in rows]


def list_notifications(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    process_due_reminders(database_path, context)
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100", (context.user["id"],)).fetchall()
    return [dict(row) for row in rows]


def notification_action(database_path: Path, context: AuthenticatedContext, notification_id: str | None, action: str) -> dict[str, Any]:
    now = iso_now()
    with closing(connect(database_path)) as connection:
        with connection:
            if action == "read-all":
                connection.execute("UPDATE notifications SET status = 'READ', read_at = ? WHERE user_id = ? AND status = 'UNREAD'", (now, context.user["id"]))
            elif action == "read":
                connection.execute("UPDATE notifications SET status = 'READ', read_at = ? WHERE id = ? AND user_id = ?", (now, notification_id, context.user["id"]))
            elif action == "dismiss":
                connection.execute("UPDATE notifications SET status = 'DISMISSED', dismissed_at = ? WHERE id = ? AND user_id = ?", (now, notification_id, context.user["id"]))
    return {"status": action}


def create_followup(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    followup_id = str(uuid.uuid4())
    title = required_text(payload, "title")
    status = str(payload.get("status", "WAITING"))
    if status not in FOLLOWUP_STATUSES:
        raise AuthError("VALIDATION_ERROR", "Invalid follow-up status.", 400)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO followups(id, user_id, title, description, status, responsible_party, expected_result,
                                      due_at, review_at, priority, next_action)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    followup_id,
                    context.user["id"],
                    title,
                    text_or_none(payload.get("description")),
                    status,
                    text_or_none(payload.get("responsible_party")),
                    text_or_none(payload.get("expected_result")),
                    text_or_none(payload.get("due_at")),
                    text_or_none(payload.get("review_at")),
                    validate_priority(str(payload.get("priority", "NONE"))),
                    text_or_none(payload.get("next_action")),
                ),
            )
            insert_followup_history(connection, followup_id, "FOLLOWUP_CREATED", context.user["id"], None, status, ["title"])
    audit(database_path, "FOLLOWUP_CREATED", context, request_id, "FOLLOWUP", followup_id)
    record_activity(database_path, context.user["id"], "FOLLOWUP_CREATED", "FOLLOWUP", followup_id, f"Created follow-up {title}")
    return get_followup(database_path, context, followup_id)


def list_followups(database_path: Path, context: AuthenticatedContext, query: dict[str, str] | None = None) -> list[dict[str, Any]]:
    query = query or {}
    sql = "SELECT * FROM followups WHERE user_id = ?"
    args: list[Any] = [context.user["id"]]
    if query.get("include_archived") != "true":
        sql += " AND status != 'ARCHIVED'"
    if query.get("search"):
        sql += " AND (lower(title) LIKE ? OR lower(COALESCE(description, '')) LIKE ? OR lower(COALESCE(responsible_party, '')) LIKE ?)"
        term = f"%{query['search'].lower()}%"
        args.extend([term, term, term])
    sql += " ORDER BY review_at IS NULL, review_at, due_at IS NULL, due_at, created_at DESC LIMIT 100"
    with closing(connect(database_path)) as connection:
        rows = connection.execute(sql, args).fetchall()
    return [followup_with_classification(row) for row in rows]


def get_followup(database_path: Path, context: AuthenticatedContext, followup_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM followups WHERE id = ? AND user_id = ?", (followup_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Follow-up not found.", 404)
    return followup_with_classification(row)


def update_followup(database_path: Path, context: AuthenticatedContext, followup_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    current = get_followup(database_path, context, followup_id)
    expected_version = payload.get("version")
    if expected_version is not None and int(expected_version) != int(current["version"]):
        raise AuthError("STALE_RECORD", "Follow-up was updated by another request.", 409)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                UPDATE followups
                SET title = ?, description = ?, responsible_party = ?, expected_result = ?, due_at = ?,
                    review_at = ?, priority = ?, next_action = ?, version = version + 1, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (
                    str(payload.get("title", current["title"])).strip(),
                    text_or_none(payload.get("description", current["description"])),
                    text_or_none(payload.get("responsible_party", current["responsible_party"])),
                    text_or_none(payload.get("expected_result", current["expected_result"])),
                    text_or_none(payload.get("due_at", current["due_at"])),
                    text_or_none(payload.get("review_at", current["review_at"])),
                    validate_priority(str(payload.get("priority", current["priority"]))),
                    text_or_none(payload.get("next_action", current["next_action"])),
                    iso_now(),
                    followup_id,
                    context.user["id"],
                ),
            )
            insert_followup_history(connection, followup_id, "FOLLOWUP_UPDATED", context.user["id"], current["status"], current["status"], list(payload.keys()))
    audit(database_path, "FOLLOWUP_UPDATED", context, request_id, "FOLLOWUP", followup_id)
    return get_followup(database_path, context, followup_id)


def followup_action(database_path: Path, context: AuthenticatedContext, followup_id: str, action: str, request_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = payload or {}
    current = get_followup(database_path, context, followup_id)
    target = {
        "resolve": "RESOLVED",
        "reopen": "OPEN",
        "cancel": "CANCELLED",
        "archive": "ARCHIVED",
        "restore": "OPEN",
        "waiting": "WAITING",
    }.get(action)
    now = iso_now()
    with closing(connect(database_path)) as connection:
        with connection:
            if action == "record-contact":
                connection.execute("UPDATE followups SET last_contact_at = ?, next_action = ?, version = version + 1, updated_at = ? WHERE id = ?", (now, text_or_none(payload.get("next_action", current["next_action"])), now, followup_id))
                target = current["status"]
            elif target:
                resolved_at = now if target == "RESOLVED" else None if current["status"] == "RESOLVED" else current["resolved_at"]
                archived_at = now if target == "ARCHIVED" else None if current["status"] == "ARCHIVED" else current["archived_at"]
                connection.execute(
                    "UPDATE followups SET status = ?, resolved_at = ?, resolution_note = ?, archived_at = ?, version = version + 1, updated_at = ? WHERE id = ?",
                    (target, resolved_at, text_or_none(payload.get("resolution_note", current["resolution_note"])), archived_at, now, followup_id),
                )
            else:
                raise AuthError("VALIDATION_ERROR", "Unsupported follow-up action.", 400)
            insert_followup_history(connection, followup_id, f"FOLLOWUP_{action.upper().replace('-', '_')}", context.user["id"], current["status"], target, [action])
    audit(database_path, f"FOLLOWUP_{action.upper().replace('-', '_')}", context, request_id, "FOLLOWUP", followup_id)
    record_activity(database_path, context.user["id"], f"FOLLOWUP_{action.upper().replace('-', '_')}", "FOLLOWUP", followup_id, f"{action.title()} follow-up {current['title']}")
    return get_followup(database_path, context, followup_id)


def followup_history(database_path: Path, context: AuthenticatedContext, followup_id: str) -> list[dict[str, Any]]:
    get_followup(database_path, context, followup_id)
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM followup_history WHERE followup_id = ? ORDER BY occurred_at DESC", (followup_id,)).fetchall()
    return [dict(row) | {"changed_fields": json.loads(row["changed_fields"])} for row in rows]


def today(database_path: Path, context: AuthenticatedContext) -> dict[str, Any]:
    process_due_reminders(database_path, context)
    tasks = list_tasks(database_path, context)
    reminders = list_reminders(database_path, context)
    followups = list_followups(database_path, context)
    calendar_events = list_today_calendar_events(database_path, context)
    return {
        "overdue_tasks": [task for task in tasks if task["due_classification"] == "OVERDUE"],
        "due_today_tasks": [task for task in tasks if task["due_classification"] == "DUE_TODAY"],
        "calendar_events": calendar_events,
        "active_reminders": [reminder for reminder in reminders if reminder["status"] in {"SCHEDULED", "DUE", "DELIVERED", "SNOOZED"}],
        "notifications": list_notifications(database_path, context),
        "due_followups": [followup for followup in followups if followup["timing_classification"] in {"DUE_TODAY", "DUE_SOON"}],
        "overdue_followups": [followup for followup in followups if followup["timing_classification"] == "OVERDUE"],
        "waiting_items": [followup for followup in followups if followup["status"] == "WAITING"],
    }


def activity(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM activity_events WHERE user_id = ? ORDER BY occurred_at DESC LIMIT 100", (context.user["id"],)).fetchall()
    return [dict(row) for row in rows]


def list_today_calendar_events(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    today_date = utc_now().date()
    start = datetime.combine(today_date, datetime.min.time(), UTC)
    end = start + timedelta(days=1)
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            """
            SELECT e.* FROM calendar_events e
            JOIN calendars c ON c.id = e.calendar_id
            WHERE e.user_id = ? AND e.status NOT IN ('CANCELLED', 'ARCHIVED') AND c.is_visible = 1
              AND (
                (e.is_all_day = 0 AND e.start_at < ? AND e.end_at > ?)
                OR (e.is_all_day = 1 AND e.start_date <= ? AND e.end_date > ?)
              )
            ORDER BY COALESCE(e.start_at, e.start_date), e.created_at
            LIMIT 50
            """,
            (
                context.user["id"],
                end.isoformat(),
                start.isoformat(),
                today_date.isoformat(),
                today_date.isoformat(),
            ),
        ).fetchall()
    return [dict(row) | {"is_all_day": bool(row["is_all_day"])} for row in rows]


def generate_next_recurrence(database_path: Path, context: AuthenticatedContext, task_id: str, request_id: str) -> None:
    task = get_task(database_path, context, task_id)
    if not task["recurrence_rule_id"] or not task["due_at"]:
        return
    with closing(connect(database_path)) as connection:
        rule = connection.execute("SELECT * FROM task_recurrence_rules WHERE id = ?", (task["recurrence_rule_id"],)).fetchone()
    if not rule:
        return
    next_number = int(task["occurrence_number"] or 1) + 1
    next_due = add_interval(parse_time(task["due_at"]) or utc_now(), rule["frequency"], int(rule["interval"]))
    payload = {
        "title": task["title"],
        "description": task["description"],
        "priority": task["priority"],
        "task_list_id": task["task_list_id"],
        "project_id": task["project_id"],
        "due_at": next_due.replace(microsecond=0).isoformat(),
    }
    next_id = str(uuid.uuid4())
    with closing(connect(database_path)) as connection:
        with connection:
            exists = connection.execute(
                "SELECT id FROM tasks WHERE recurrence_series_id = ? AND occurrence_number = ?",
                (task["recurrence_series_id"], next_number),
            ).fetchone()
            if exists:
                return
            connection.execute(
                """
                INSERT INTO tasks(id, user_id, title, description, status, priority, task_list_id, project_id,
                                  due_at, recurrence_series_id, previous_occurrence_id, occurrence_number,
                                  scheduled_for, source_type)
                VALUES (?, ?, ?, ?, 'PLANNED', ?, ?, ?, ?, ?, ?, ?, ?, 'RECURRENCE')
                """,
                (
                    next_id,
                    context.user["id"],
                    payload["title"],
                    payload["description"],
                    payload["priority"],
                    payload["task_list_id"],
                    payload["project_id"],
                    payload["due_at"],
                    task["recurrence_series_id"],
                    task_id,
                    next_number,
                    payload["due_at"],
                ),
            )
            insert_task_history(connection, next_id, "TASK_CREATED_FROM_RECURRENCE", context.user["id"], None, "PLANNED", ["recurrence"])
    audit(database_path, "TASK_RECURRENCE_GENERATED", context, request_id, "TASK", next_id)


def add_interval(value: datetime, frequency: str, interval: int) -> datetime:
    if frequency == "DAILY":
        return value + timedelta(days=interval)
    if frequency == "WEEKLY":
        return value + timedelta(weeks=interval)
    if frequency == "MONTHLY":
        return value + timedelta(days=30 * interval)
    if frequency == "YEARLY":
        return value + timedelta(days=365 * interval)
    return value


def classify_due(value: str | None, status: str) -> str:
    if status == "COMPLETED":
        return "COMPLETED"
    if status in {"CANCELLED", "ARCHIVED"}:
        return status
    due = parse_time(value)
    if due is None:
        return "NO_DUE_DATE"
    now = utc_now()
    if due < now:
        return "OVERDUE"
    if due.date() == now.date():
        return "DUE_TODAY"
    if due <= now + timedelta(days=3):
        return "DUE_SOON"
    return "FUTURE"


def task_with_classification(row: Any) -> dict[str, Any]:
    task = dict(row)
    task["due_classification"] = classify_due(task["due_at"], task["status"])
    return task


def followup_with_classification(row: Any) -> dict[str, Any]:
    followup = dict(row)
    value = followup["review_at"] or followup["due_at"]
    if not value:
        followup["timing_classification"] = "NO_REVIEW_DATE"
    else:
        classification = classify_due(value, "PLANNED")
        followup["timing_classification"] = "NOT_DUE" if classification == "FUTURE" else classification
    return followup


def task_sort_key(task: dict[str, Any]) -> tuple[int, int, str]:
    due_rank = {"OVERDUE": 0, "DUE_TODAY": 2, "DUE_SOON": 3, "FUTURE": 5, "NO_DUE_DATE": 6, "COMPLETED": 7, "CANCELLED": 8, "ARCHIVED": 9}
    return (due_rank.get(task["due_classification"], 9), PRIORITY_RANK.get(task["priority"], 4), task["created_at"])


def validate_task_dates(payload: dict[str, Any]) -> None:
    start = parse_time(text_or_none(payload.get("start_at")))
    due = parse_time(text_or_none(payload.get("due_at")))
    if start and due and start > due:
        raise AuthError("VALIDATION_ERROR", "Start time must not be after due time.", 400)
    minutes = payload.get("estimated_minutes")
    if minutes not in (None, "") and not 1 <= int(minutes) <= 1440:
        raise AuthError("VALIDATION_ERROR", "Estimated minutes must be between 1 and 1440.", 400)


def validate_status(status: str) -> str:
    status = status.upper()
    if status not in TASK_STATUSES:
        raise AuthError("VALIDATION_ERROR", "Invalid task status.", 400)
    return status


def validate_priority(priority: str) -> str:
    priority = priority.upper()
    if priority not in PRIORITIES:
        raise AuthError("VALIDATION_ERROR", "Invalid priority.", 400)
    return priority


def task_event_for_status(target: str, previous: str) -> str:
    if target == "COMPLETED":
        return "TASK_COMPLETED"
    if target == "PLANNED" and previous in {"COMPLETED", "CANCELLED", "ARCHIVED"}:
        return "TASK_REOPENED" if previous != "ARCHIVED" else "TASK_RESTORED"
    if target == "CANCELLED":
        return "TASK_CANCELLED"
    if target == "ARCHIVED":
        return "TASK_ARCHIVED"
    return "TASK_STATUS_CHANGED"


def insert_task_history(connection: Any, task_id: str, event_type: str, actor_id: str | None, previous: str | None, new: str | None, changed: list[str]) -> None:
    connection.execute(
        "INSERT INTO task_history(id, task_id, event_type, actor_type, actor_id, previous_state, new_state, changed_fields) VALUES (?, ?, ?, 'USER', ?, ?, ?, ?)",
        (str(uuid.uuid4()), task_id, event_type, actor_id, previous, new, json.dumps(changed)),
    )


def insert_followup_history(connection: Any, followup_id: str, event_type: str, actor_id: str | None, previous: str | None, new: str | None, changed: list[str]) -> None:
    connection.execute(
        "INSERT INTO followup_history(id, followup_id, event_type, actor_type, actor_id, previous_state, new_state, changed_fields) VALUES (?, ?, ?, 'USER', ?, ?, ?, ?)",
        (str(uuid.uuid4()), followup_id, event_type, actor_id, previous, new, json.dumps(changed)),
    )


def record_activity(database_path: Path, user_id: str, event_type: str, resource_type: str, resource_id: str, summary: str) -> None:
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "INSERT INTO activity_events(id, user_id, event_type, resource_type, resource_id, summary) VALUES (?, ?, ?, ?, ?, ?)",
                (str(uuid.uuid4()), user_id, event_type, resource_type, resource_id, summary),
            )


def audit(database_path: Path, event_type: str, context: AuthenticatedContext, request_id: str, resource_type: str, resource_id: str, metadata: dict[str, Any] | None = None) -> None:
    record_audit_event(
        database_path,
        event_type,
        "USER",
        "SUCCEEDED",
        request_id,
        actor_id=context.user["id"],
        session_id=context.session["id"],
        resource_type=resource_type,
        resource_id=resource_id,
        metadata=metadata or {},
    )


def required_text(payload: dict[str, Any], key: str) -> str:
    value = str(payload.get(key, "")).strip()
    if not value:
        raise AuthError("VALIDATION_ERROR", f"{key} is required.", 400)
    return value


def text_or_none(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None
