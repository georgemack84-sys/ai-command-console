from __future__ import annotations

import json
import uuid
from contextlib import closing
from datetime import UTC, date, datetime, time, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from day_to_day_assistant_api.auth import AuthError, AuthenticatedContext
from day_to_day_assistant_api.audit import record_audit_event
from day_to_day_assistant_api.database import connect
from day_to_day_assistant_api.productivity import create_reminder, record_activity, text_or_none


EVENT_STATUSES = {"CONFIRMED", "TENTATIVE", "CANCELLED", "ARCHIVED"}
EVENT_TYPES = {"STANDARD", "APPOINTMENT", "MEETING", "FOCUS_BLOCK", "TRAVEL", "PERSONAL", "DEADLINE", "REMINDER_ONLY"}
AVAILABILITY = {"BUSY", "FREE", "TENTATIVE", "OUT_OF_OFFICE"}


def utc_now() -> datetime:
    return datetime.now(UTC)


def iso_now() -> str:
    return utc_now().replace(microsecond=0).isoformat()


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def ensure_timezone(value: str) -> str:
    try:
        ZoneInfo(value)
    except ZoneInfoNotFoundError as exc:
        raise AuthError("VALIDATION_ERROR", "Invalid timezone.", 400) from exc
    return value


def ensure_default_calendar(database_path: Path, context: AuthenticatedContext) -> str:
    with closing(connect(database_path)) as connection:
        row = connection.execute(
            "SELECT id FROM calendars WHERE user_id = ? AND is_default = 1 AND is_archived = 0",
            (context.user["id"],),
        ).fetchone()
        if row:
            return str(row["id"])
        calendar_id = str(uuid.uuid4())
        with connection:
            connection.execute(
                """
                INSERT INTO calendars(id, user_id, name, description, color_key, timezone, is_default, position)
                VALUES (?, ?, 'Personal', 'Default local calendar', 'blue', ?, 1, 0)
                """,
                (calendar_id, context.user["id"], context.user["timezone"]),
            )
        return calendar_id


def create_calendar(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    calendar_id = str(uuid.uuid4())
    name = required_text(payload, "name")
    timezone = ensure_timezone(str(payload.get("timezone", context.user["timezone"])))
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO calendars(id, user_id, name, description, color_key, timezone, position)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    calendar_id,
                    context.user["id"],
                    name,
                    text_or_none(payload.get("description")),
                    str(payload.get("color_key", "blue")),
                    timezone,
                    int(payload.get("position", 0)),
                ),
            )
    activity(database_path, context, "CALENDAR_CREATED", "CALENDAR", calendar_id, f"Created calendar {name}", request_id)
    return get_calendar(database_path, context, calendar_id)


def list_calendars(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    ensure_default_calendar(database_path, context)
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            "SELECT * FROM calendars WHERE user_id = ? AND is_archived = 0 ORDER BY is_default DESC, position, name",
            (context.user["id"],),
        ).fetchall()
    return [dict(row) for row in rows]


def get_calendar(database_path: Path, context: AuthenticatedContext, calendar_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM calendars WHERE id = ? AND user_id = ?", (calendar_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Calendar not found.", 404)
    return dict(row)


def update_calendar(database_path: Path, context: AuthenticatedContext, calendar_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    current = get_calendar(database_path, context, calendar_id)
    timezone = ensure_timezone(str(payload.get("timezone", current["timezone"])))
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                UPDATE calendars
                SET name = ?, description = ?, color_key = ?, timezone = ?, is_visible = ?, position = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (
                    str(payload.get("name", current["name"])).strip(),
                    text_or_none(payload.get("description", current["description"])),
                    str(payload.get("color_key", current["color_key"])),
                    timezone,
                    1 if bool(payload.get("is_visible", current["is_visible"])) else 0,
                    int(payload.get("position", current["position"])),
                    iso_now(),
                    calendar_id,
                    context.user["id"],
                ),
            )
    activity(database_path, context, "CALENDAR_UPDATED", "CALENDAR", calendar_id, f"Updated calendar {current['name']}", request_id)
    return get_calendar(database_path, context, calendar_id)


def calendar_action(database_path: Path, context: AuthenticatedContext, calendar_id: str, action: str, request_id: str) -> dict[str, Any]:
    current = get_calendar(database_path, context, calendar_id)
    with closing(connect(database_path)) as connection:
        with connection:
            if action == "set-default":
                connection.execute("UPDATE calendars SET is_default = 0 WHERE user_id = ?", (context.user["id"],))
                connection.execute("UPDATE calendars SET is_default = 1, is_visible = 1, is_archived = 0, updated_at = ? WHERE id = ?", (iso_now(), calendar_id))
            elif action == "archive":
                if current["is_default"]:
                    raise AuthError("VALIDATION_ERROR", "Default calendar cannot be archived.", 400)
                connection.execute("UPDATE calendars SET is_archived = 1, updated_at = ? WHERE id = ?", (iso_now(), calendar_id))
            elif action == "restore":
                connection.execute("UPDATE calendars SET is_archived = 0, updated_at = ? WHERE id = ?", (iso_now(), calendar_id))
            else:
                raise AuthError("VALIDATION_ERROR", "Unsupported calendar action.", 400)
    activity(database_path, context, f"CALENDAR_{action.upper().replace('-', '_')}", "CALENDAR", calendar_id, f"{action} calendar {current['name']}", request_id)
    return get_calendar(database_path, context, calendar_id)


def delete_calendar(database_path: Path, context: AuthenticatedContext, calendar_id: str, request_id: str) -> dict[str, Any]:
    current = get_calendar(database_path, context, calendar_id)
    if current["is_default"]:
        raise AuthError("VALIDATION_ERROR", "Default calendar cannot be deleted.", 400)
    with closing(connect(database_path)) as connection:
        event_count = connection.execute("SELECT COUNT(*) AS count FROM calendar_events WHERE calendar_id = ?", (calendar_id,)).fetchone()["count"]
        if event_count:
            raise AuthError("VALIDATION_ERROR", "Calendar has events and cannot be deleted without reassignment.", 400)
        with connection:
            connection.execute("DELETE FROM calendars WHERE id = ? AND user_id = ?", (calendar_id, context.user["id"]))
    activity(database_path, context, "CALENDAR_DELETED", "CALENDAR", calendar_id, f"Deleted calendar {current['name']}", request_id)
    return current


def create_event(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    event_id = str(uuid.uuid4())
    calendar_id = str(payload.get("calendar_id") or ensure_default_calendar(database_path, context))
    get_calendar(database_path, context, calendar_id)
    normalized = normalize_event_payload(context, payload)
    recurrence_frequency = payload.get("recurrence_frequency")
    recurrence_rule_id = str(uuid.uuid4()) if recurrence_frequency else None
    recurrence_series_id = str(uuid.uuid4()) if recurrence_frequency else None
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO calendar_events(
                  id, user_id, calendar_id, title, description, location, status, event_type,
                  start_at, end_at, start_date, end_date, timezone, is_all_day,
                  availability_status, visibility, recurrence_series_id, recurrence_rule_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event_id,
                    context.user["id"],
                    calendar_id,
                    normalized["title"],
                    normalized["description"],
                    normalized["location"],
                    normalized["status"],
                    normalized["event_type"],
                    normalized["start_at"],
                    normalized["end_at"],
                    normalized["start_date"],
                    normalized["end_date"],
                    normalized["timezone"],
                    1 if normalized["is_all_day"] else 0,
                    normalized["availability_status"],
                    normalized["visibility"],
                    recurrence_series_id,
                    recurrence_rule_id,
                ),
            )
            if recurrence_rule_id:
                duration = event_duration_minutes(normalized)
                connection.execute(
                    """
                    INSERT INTO event_recurrence_rules(id, series_event_id, frequency, interval, start_local_time, duration_minutes, timezone)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        recurrence_rule_id,
                        event_id,
                        str(recurrence_frequency).upper(),
                        int(payload.get("recurrence_interval", 1)),
                        normalized["start_at"] or normalized["start_date"],
                        duration,
                        normalized["timezone"],
                    ),
                )
            insert_history(connection, event_id, "EVENT_CREATED", context.user["id"], None, normalized["status"], ["title"])
    for offset in payload.get("reminder_offsets", []):
        create_event_reminder(database_path, context, event_id, int(offset), request_id)
    activity(database_path, context, "EVENT_CREATED", "CALENDAR_EVENT", event_id, f"Created event {normalized['title']}", request_id)
    return get_event(database_path, context, event_id)


def list_events(database_path: Path, context: AuthenticatedContext, query: dict[str, str] | None = None) -> list[dict[str, Any]]:
    query = query or {}
    start = parse_dt(query.get("start")) or (utc_now() - timedelta(days=30))
    end = parse_dt(query.get("end")) or (utc_now() + timedelta(days=90))
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            """
            SELECT e.* FROM calendar_events e
            JOIN calendars c ON c.id = e.calendar_id
            WHERE e.user_id = ? AND e.status != 'ARCHIVED' AND c.is_visible = 1
              AND (
                (e.is_all_day = 0 AND e.start_at < ? AND e.end_at > ?)
                OR (e.is_all_day = 1)
                OR e.recurrence_rule_id IS NOT NULL
              )
            ORDER BY COALESCE(e.start_at, e.start_date), e.created_at
            LIMIT 500
            """,
            (context.user["id"], end.isoformat(), start.isoformat()),
        ).fetchall()
    events: list[dict[str, Any]] = []
    for row in rows:
        event = event_dict(row)
        if event["recurrence_rule_id"]:
            events.extend(expand_event(database_path, context, event, start, end))
        elif event_in_range(event, start, end):
            events.append(event)
    return sorted(events, key=lambda item: item.get("start_at") or item.get("start_date") or "")


def get_event(database_path: Path, context: AuthenticatedContext, event_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM calendar_events WHERE id = ? AND user_id = ?", (event_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Event not found.", 404)
    return event_dict(row)


def update_event(database_path: Path, context: AuthenticatedContext, event_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    current = get_event(database_path, context, event_id)
    expected_version = payload.get("version")
    if expected_version is not None and int(expected_version) != int(current["version"]):
        raise AuthError("STALE_RECORD", "Event was updated by another request.", 409)
    merged = current | payload
    normalized = normalize_event_payload(context, merged)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                UPDATE calendar_events
                SET calendar_id = ?, title = ?, description = ?, location = ?, status = ?, event_type = ?,
                    start_at = ?, end_at = ?, start_date = ?, end_date = ?, timezone = ?, is_all_day = ?,
                    availability_status = ?, visibility = ?, version = version + 1, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (
                    str(payload.get("calendar_id", current["calendar_id"])),
                    normalized["title"],
                    normalized["description"],
                    normalized["location"],
                    normalized["status"],
                    normalized["event_type"],
                    normalized["start_at"],
                    normalized["end_at"],
                    normalized["start_date"],
                    normalized["end_date"],
                    normalized["timezone"],
                    1 if normalized["is_all_day"] else 0,
                    normalized["availability_status"],
                    normalized["visibility"],
                    iso_now(),
                    event_id,
                    context.user["id"],
                ),
            )
            insert_history(connection, event_id, "EVENT_UPDATED", context.user["id"], current["status"], normalized["status"], list(payload.keys()))
    activity(database_path, context, "EVENT_UPDATED", "CALENDAR_EVENT", event_id, f"Updated event {current['title']}", request_id)
    return get_event(database_path, context, event_id)


def event_action(database_path: Path, context: AuthenticatedContext, event_id: str, action: str, request_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = payload or {}
    current = get_event(database_path, context, event_id)
    now = iso_now()
    if action == "copy":
        copied = current | {"title": payload.get("title", f"Copy of {current['title']}")}
        copied.pop("id", None)
        return create_event(database_path, context, copied, request_id)
    if action == "move":
        return update_event(database_path, context, event_id, {"start_at": payload.get("start_at"), "end_at": payload.get("end_at"), "version": current["version"]}, request_id)
    target = {"confirm": "CONFIRMED", "tentative": "TENTATIVE", "cancel": "CANCELLED", "restore": "CONFIRMED", "archive": "ARCHIVED"}.get(action)
    if not target:
        raise AuthError("VALIDATION_ERROR", "Unsupported event action.", 400)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "UPDATE calendar_events SET status = ?, cancelled_at = ?, archived_at = ?, version = version + 1, updated_at = ? WHERE id = ? AND user_id = ?",
                (
                    target,
                    now if target == "CANCELLED" else None,
                    now if target == "ARCHIVED" else None,
                    now,
                    event_id,
                    context.user["id"],
                ),
            )
            if target in {"CANCELLED", "ARCHIVED"}:
                connection.execute(
                    """
                    UPDATE reminder_jobs
                    SET status = 'CANCELLED'
                    WHERE reminder_id IN (SELECT reminder_id FROM event_reminder_links WHERE event_id = ?)
                      AND status = 'PENDING'
                    """,
                    (event_id,),
                )
            insert_history(connection, event_id, f"EVENT_{action.upper()}", context.user["id"], current["status"], target, ["status"])
    activity(database_path, context, f"EVENT_{action.upper()}", "CALENDAR_EVENT", event_id, f"{action.title()} event {current['title']}", request_id)
    return get_event(database_path, context, event_id)


def delete_event(database_path: Path, context: AuthenticatedContext, event_id: str, request_id: str) -> dict[str, Any]:
    archived = event_action(database_path, context, event_id, "archive", request_id)
    audit(database_path, "EVENT_DELETE_REQUESTED", context, request_id, event_id)
    return archived


def event_history(database_path: Path, context: AuthenticatedContext, event_id: str) -> list[dict[str, Any]]:
    get_event(database_path, context, event_id)
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM event_history WHERE event_id = ? ORDER BY occurred_at DESC", (event_id,)).fetchall()
    return [dict(row) | {"changed_fields": json.loads(row["changed_fields"])} for row in rows]


def create_recurrence(database_path: Path, context: AuthenticatedContext, event_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    event = get_event(database_path, context, event_id)
    rule_id = str(uuid.uuid4())
    series_id = event["recurrence_series_id"] or str(uuid.uuid4())
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO event_recurrence_rules(id, series_event_id, frequency, interval, start_local_time, duration_minutes, timezone)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    rule_id,
                    event_id,
                    str(payload.get("frequency", "WEEKLY")).upper(),
                    int(payload.get("interval", 1)),
                    event["start_at"] or event["start_date"],
                    event_duration_minutes(event),
                    event["timezone"],
                ),
            )
            connection.execute("UPDATE calendar_events SET recurrence_rule_id = ?, recurrence_series_id = ?, updated_at = ? WHERE id = ?", (rule_id, series_id, iso_now(), event_id))
            insert_history(connection, event_id, "EVENT_RECURRENCE_UPDATED", context.user["id"], event["status"], event["status"], ["recurrence"])
    activity(database_path, context, "EVENT_RECURRENCE_UPDATED", "CALENDAR_EVENT", event_id, f"Updated recurrence for {event['title']}", request_id)
    return get_event(database_path, context, event_id)


def occurrence_action(database_path: Path, context: AuthenticatedContext, event_id: str, occurrence_key: str, action: str, request_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = payload or {}
    event = get_event(database_path, context, event_id)
    replacement_id = None
    exception_type = "CANCELLED"
    if action == "modify":
        replacement = create_event(database_path, context, event | payload | {"parent_event_id": event_id, "recurrence_series_id": event["recurrence_series_id"], "original_occurrence_at": occurrence_key}, request_id)
        replacement_id = replacement["id"]
        exception_type = "MODIFIED"
    elif action == "restore":
        with closing(connect(database_path)) as connection:
            with connection:
                connection.execute("DELETE FROM event_recurrence_exceptions WHERE series_event_id = ? AND original_occurrence_at = ?", (event_id, occurrence_key))
        return event
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT OR REPLACE INTO event_recurrence_exceptions(id, series_event_id, original_occurrence_at, exception_type, replacement_event_id, updated_at)
                VALUES (COALESCE((SELECT id FROM event_recurrence_exceptions WHERE series_event_id = ? AND original_occurrence_at = ?), ?), ?, ?, ?, ?, ?)
                """,
                (event_id, occurrence_key, str(uuid.uuid4()), event_id, occurrence_key, exception_type, replacement_id, iso_now()),
            )
            insert_history(connection, event_id, f"EVENT_OCCURRENCE_{action.upper()}", context.user["id"], event["status"], event["status"], [occurrence_key])
    activity(database_path, context, f"EVENT_OCCURRENCE_{action.upper()}", "CALENDAR_EVENT", event_id, f"{action.title()} occurrence {event['title']}", request_id)
    return event


def split_series(database_path: Path, context: AuthenticatedContext, event_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    event = get_event(database_path, context, event_id)
    new_event = create_event(database_path, context, event | payload | {"title": payload.get("title", event["title"]), "recurrence_frequency": payload.get("frequency", "WEEKLY")}, request_id)
    activity(database_path, context, "EVENT_SERIES_SPLIT", "CALENDAR_EVENT", new_event["id"], f"Split series {event['title']}", request_id)
    return new_event


def create_preparation_item(database_path: Path, context: AuthenticatedContext, event_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    get_event(database_path, context, event_id)
    item_id = str(uuid.uuid4())
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "INSERT INTO event_preparation_items(id, event_id, title, description, status, due_at, position) VALUES (?, ?, ?, ?, 'OPEN', ?, ?)",
                (item_id, event_id, required_text(payload, "title"), text_or_none(payload.get("description")), text_or_none(payload.get("due_at")), int(payload.get("position", 0))),
            )
    activity(database_path, context, "EVENT_PREPARATION_CREATED", "CALENDAR_EVENT", event_id, "Created preparation item", request_id)
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM event_preparation_items WHERE id = ?", (item_id,)).fetchone()
    return dict(row)


def get_preparation_items(database_path: Path, context: AuthenticatedContext, event_id: str) -> list[dict[str, Any]]:
    get_event(database_path, context, event_id)
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM event_preparation_items WHERE event_id = ? ORDER BY position, created_at", (event_id,)).fetchall()
    return [dict(row) for row in rows]


def link_task(database_path: Path, context: AuthenticatedContext, event_id: str, task_id: str, request_id: str) -> dict[str, str]:
    get_event(database_path, context, event_id)
    with closing(connect(database_path)) as connection:
        task = connection.execute("SELECT id FROM tasks WHERE id = ? AND user_id = ?", (task_id, context.user["id"])).fetchone()
        if not task:
            raise AuthError("NOT_FOUND", "Task not found.", 404)
        with connection:
            connection.execute("INSERT OR IGNORE INTO event_task_links(event_id, task_id) VALUES (?, ?)", (event_id, task_id))
    activity(database_path, context, "EVENT_TASK_LINKED", "CALENDAR_EVENT", event_id, "Linked task to event", request_id)
    return {"event_id": event_id, "task_id": task_id}


def link_followup(database_path: Path, context: AuthenticatedContext, event_id: str, followup_id: str, request_id: str) -> dict[str, str]:
    get_event(database_path, context, event_id)
    with closing(connect(database_path)) as connection:
        followup = connection.execute("SELECT id FROM followups WHERE id = ? AND user_id = ?", (followup_id, context.user["id"])).fetchone()
        if not followup:
            raise AuthError("NOT_FOUND", "Follow-up not found.", 404)
        with connection:
            connection.execute("INSERT OR IGNORE INTO event_followup_links(event_id, followup_id) VALUES (?, ?)", (event_id, followup_id))
    activity(database_path, context, "EVENT_FOLLOWUP_LINKED", "CALENDAR_EVENT", event_id, "Linked follow-up to event", request_id)
    return {"event_id": event_id, "followup_id": followup_id}


def conflicts(database_path: Path, context: AuthenticatedContext, query: dict[str, str]) -> list[dict[str, Any]]:
    events = [event for event in list_events(database_path, context, query) if blocks_time(event)]
    found: list[dict[str, Any]] = []
    for index, first in enumerate(events):
        for second in events[index + 1 :]:
            if overlaps(first, second):
                found.append({"severity": "HARD" if first["status"] == "CONFIRMED" and second["status"] == "CONFIRMED" else "TENTATIVE", "events": [first, second], "explanation": "Events overlap and both block time."})
    return found


def availability(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any]) -> dict[str, Any]:
    start = parse_dt(payload.get("start")) or datetime.combine(date.today(), time(9), UTC)
    end = parse_dt(payload.get("end")) or start + timedelta(hours=8)
    minimum = int(payload.get("minimum_minutes", 30))
    busy = sorted([interval(event) for event in list_events(database_path, context, {"start": start.isoformat(), "end": end.isoformat()}) if blocks_time(event)])
    merged = merge_intervals(busy)
    free: list[dict[str, str]] = []
    cursor = start
    for busy_start, busy_end in merged:
        if busy_start > cursor and (busy_start - cursor).total_seconds() >= minimum * 60:
            free.append({"start": cursor.isoformat(), "end": busy_start.isoformat()})
        cursor = max(cursor, busy_end)
    if end > cursor and (end - cursor).total_seconds() >= minimum * 60:
        free.append({"start": cursor.isoformat(), "end": end.isoformat()})
    return {"busy": [{"start": item[0].isoformat(), "end": item[1].isoformat()} for item in merged], "free": free}


def search_events(database_path: Path, context: AuthenticatedContext, query: dict[str, str]) -> list[dict[str, Any]]:
    term = f"%{query.get('q', '').lower()}%"
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            "SELECT * FROM calendar_events WHERE user_id = ? AND status != 'ARCHIVED' AND (lower(title) LIKE ? OR lower(COALESCE(description, '')) LIKE ? OR lower(COALESCE(location, '')) LIKE ?) ORDER BY COALESCE(start_at, start_date) LIMIT 100",
            (context.user["id"], term, term, term),
        ).fetchall()
    return [event_dict(row) for row in rows]


def export_event(database_path: Path, context: AuthenticatedContext, event_id: str) -> str:
    event = get_event(database_path, context, event_id)
    start = event["start_at"] or event["start_date"]
    end = event["end_at"] or event["end_date"]
    return "\n".join(["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", f"UID:{event['id']}", f"SUMMARY:{event['title']}", f"DTSTART:{start}", f"DTEND:{end}", "END:VEVENT", "END:VCALENDAR"])


def create_event_reminder(database_path: Path, context: AuthenticatedContext, event_id: str, offset_minutes: int, request_id: str) -> dict[str, Any]:
    event = get_event(database_path, context, event_id)
    start = parse_dt(event["start_at"])
    if start is None:
        return {}
    delivery = (start - timedelta(minutes=offset_minutes)).replace(microsecond=0).isoformat()
    reminder = create_reminder(database_path, context, {"title": f"Event: {event['title']}", "message": event["location"], "scheduled_at": delivery, "related_type": "CALENDAR_EVENT", "related_id": event_id}, request_id)
    link_id = str(uuid.uuid4())
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "INSERT OR IGNORE INTO event_reminder_links(id, event_id, reminder_id, offset_minutes, delivery_at, occurrence_key) VALUES (?, ?, ?, ?, ?, ?)",
                (link_id, event_id, reminder["id"], offset_minutes, delivery, event.get("occurrence_key")),
            )
    return reminder


def expand_event(database_path: Path, context: AuthenticatedContext, event: dict[str, Any], start: datetime, end: datetime) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rule = connection.execute("SELECT * FROM event_recurrence_rules WHERE id = ?", (event["recurrence_rule_id"],)).fetchone()
        exceptions = {
            row["original_occurrence_at"]: row
            for row in connection.execute("SELECT * FROM event_recurrence_exceptions WHERE series_event_id = ?", (event["id"],)).fetchall()
        }
    if not rule:
        return [event]
    occurrences: list[dict[str, Any]] = []
    current_start = parse_dt(event["start_at"])
    current_end = parse_dt(event["end_at"])
    if current_start is None or current_end is None:
        return [event]
    count = 0
    while current_start < end and count < 366:
        key = current_start.isoformat()
        exception = exceptions.get(key)
        if current_end > start and not (exception and exception["exception_type"] == "CANCELLED"):
            if exception and exception["replacement_event_id"]:
                occurrences.append(get_event(database_path, context, exception["replacement_event_id"]))
            else:
                occurrence = event.copy()
                occurrence["occurrence_key"] = key
                occurrence["series_id"] = event["recurrence_series_id"]
                occurrence["is_exception"] = False
                occurrence["start_at"] = current_start.isoformat()
                occurrence["end_at"] = current_end.isoformat()
                occurrences.append(occurrence)
        next_start = add_interval(current_start, rule["frequency"], int(rule["interval"]))
        delta = next_start - current_start
        current_start = next_start
        current_end = current_end + delta
        count += 1
    return occurrences


def add_interval(value: datetime, frequency: str, interval_count: int) -> datetime:
    if frequency == "DAILY":
        return value + timedelta(days=interval_count)
    if frequency == "WEEKLY":
        return value + timedelta(weeks=interval_count)
    if frequency == "MONTHLY":
        return value + timedelta(days=30 * interval_count)
    if frequency == "YEARLY":
        return value + timedelta(days=365 * interval_count)
    return value


def normalize_event_payload(context: AuthenticatedContext, payload: dict[str, Any]) -> dict[str, Any]:
    is_all_day = bool(payload.get("is_all_day", False))
    timezone = ensure_timezone(str(payload.get("timezone", context.user["timezone"])))
    status = str(payload.get("status", "CONFIRMED")).upper()
    event_type = str(payload.get("event_type", "STANDARD")).upper()
    availability = str(payload.get("availability_status", "BUSY")).upper()
    if status not in EVENT_STATUSES or event_type not in EVENT_TYPES or availability not in AVAILABILITY:
        raise AuthError("VALIDATION_ERROR", "Invalid calendar event vocabulary.", 400)
    if is_all_day:
        start_date = required_text(payload, "start_date")
        end_date = required_text(payload, "end_date")
        if date.fromisoformat(end_date) <= date.fromisoformat(start_date):
            raise AuthError("VALIDATION_ERROR", "All-day end date must be after start date.", 400)
        start_at = end_at = None
    else:
        start = parse_dt(required_text(payload, "start_at"))
        end = parse_dt(required_text(payload, "end_at"))
        if start is None or end is None or end <= start:
            raise AuthError("VALIDATION_ERROR", "Event end must be after start.", 400)
        start_at, end_at = start.isoformat(), end.isoformat()
        start_date = end_date = None
    return {
        "title": required_text(payload, "title"),
        "description": text_or_none(payload.get("description")),
        "location": text_or_none(payload.get("location")),
        "status": status,
        "event_type": event_type,
        "start_at": start_at,
        "end_at": end_at,
        "start_date": start_date,
        "end_date": end_date,
        "timezone": timezone,
        "is_all_day": is_all_day,
        "availability_status": availability,
        "visibility": str(payload.get("visibility", "DEFAULT")).upper(),
    }


def event_dict(row: Any) -> dict[str, Any]:
    event = dict(row)
    event["is_all_day"] = bool(event["is_all_day"])
    return event


def event_duration_minutes(event: dict[str, Any]) -> int:
    start = parse_dt(event.get("start_at"))
    end = parse_dt(event.get("end_at"))
    if not start or not end:
        return 1440
    return int((end - start).total_seconds() // 60)


def event_in_range(event: dict[str, Any], start: datetime, end: datetime) -> bool:
    if event["is_all_day"]:
        return True
    event_start = parse_dt(event["start_at"])
    event_end = parse_dt(event["end_at"])
    return bool(event_start and event_end and event_start < end and event_end > start)


def blocks_time(event: dict[str, Any]) -> bool:
    return event["status"] in {"CONFIRMED", "TENTATIVE"} and event["availability_status"] in {"BUSY", "TENTATIVE", "OUT_OF_OFFICE"} and not event["is_all_day"]


def interval(event: dict[str, Any]) -> tuple[datetime, datetime]:
    start = parse_dt(event["start_at"])
    end = parse_dt(event["end_at"])
    if start is None or end is None:
        raise AuthError("VALIDATION_ERROR", "Timed event interval missing.", 400)
    return start, end


def overlaps(first: dict[str, Any], second: dict[str, Any]) -> bool:
    first_start, first_end = interval(first)
    second_start, second_end = interval(second)
    return first_start < second_end and second_start < first_end


def merge_intervals(intervals: list[tuple[datetime, datetime]]) -> list[tuple[datetime, datetime]]:
    merged: list[tuple[datetime, datetime]] = []
    for start, end in intervals:
        if not merged or start > merged[-1][1]:
            merged.append((start, end))
        else:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
    return merged


def insert_history(connection: Any, event_id: str, event_type: str, actor_id: str | None, previous: str | None, new: str | None, changed: list[str]) -> None:
    connection.execute(
        "INSERT INTO event_history(id, event_id, event_type, actor_type, actor_id, previous_state, new_state, changed_fields) VALUES (?, ?, ?, 'USER', ?, ?, ?, ?)",
        (str(uuid.uuid4()), event_id, event_type, actor_id, previous, new, json.dumps(changed)),
    )


def activity(database_path: Path, context: AuthenticatedContext, event_type: str, resource_type: str, resource_id: str, summary: str, request_id: str) -> None:
    record_activity(database_path, context.user["id"], event_type, resource_type, resource_id, summary)
    audit(database_path, event_type, context, request_id, resource_id)


def audit(database_path: Path, event_type: str, context: AuthenticatedContext, request_id: str, resource_id: str) -> None:
    record_audit_event(database_path, event_type, "USER", "SUCCEEDED", request_id, actor_id=context.user["id"], session_id=context.session["id"], resource_type="CALENDAR_EVENT", resource_id=resource_id)


def required_text(payload: dict[str, Any], key: str) -> str:
    value = str(payload.get(key, "")).strip()
    if not value:
        raise AuthError("VALIDATION_ERROR", f"{key} is required.", 400)
    return value
