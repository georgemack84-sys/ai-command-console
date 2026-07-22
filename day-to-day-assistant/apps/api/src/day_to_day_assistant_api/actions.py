from __future__ import annotations

import hashlib
import json
import secrets
import time
import uuid
from contextlib import closing
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path
from typing import Any, Callable

from day_to_day_assistant_api import calendar as cal
from day_to_day_assistant_api import notes
from day_to_day_assistant_api import productivity as prod
from day_to_day_assistant_api.audit import record_audit_event
from day_to_day_assistant_api.auth import AuthError, AuthenticatedContext, iso_now, parse_iso, utc_now
from day_to_day_assistant_api.database import connect
from day_to_day_assistant_api.security import hash_token


PROPOSAL_STATUSES = {
    "DRAFT",
    "AWAITING_CONFIRMATION",
    "APPROVED",
    "REJECTED",
    "EXPIRED",
    "EXECUTING",
    "COMPLETED",
    "FAILED",
    "ROLLED_BACK",
}


@dataclass(frozen=True)
class WriteTool:
    name: str
    description: str
    authority: str
    reversible: bool
    input_schema: dict[str, Any]
    output_schema: dict[str, Any]
    executor: Callable[[Path, AuthenticatedContext, dict[str, Any], str], dict[str, Any]]
    verifier: Callable[[Path, AuthenticatedContext, dict[str, Any]], dict[str, Any]]
    rollback_strategy: str


def _tool_task_create(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    return {"task": prod.create_task(database_path, context, payload, request_id)}


def _tool_task_update(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    task_id = required_text(payload, "task_id")
    changes = dict(payload.get("changes") or {})
    return {"task": prod.update_task(database_path, context, task_id, changes, request_id)}


def _tool_task_complete(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    task_id = required_text(payload, "task_id")
    current = prod.get_task(database_path, context, task_id)
    if current["status"] == "INBOX":
        prod.transition_task(database_path, context, task_id, "PLANNED", request_id, payload)
    return {"task": prod.transition_task(database_path, context, task_id, "COMPLETED", request_id, payload)}


def _tool_reminder_create(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    return {"reminder": prod.create_reminder(database_path, context, payload, request_id)}


def _tool_reminder_update(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    return {"reminder": prod.reminder_action(database_path, context, required_text(payload, "reminder_id"), "snooze", request_id, payload)}


def _tool_reminder_cancel(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    return {"reminder": prod.reminder_action(database_path, context, required_text(payload, "reminder_id"), "cancel", request_id, payload)}


def _tool_event_create(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    return {"event": cal.create_event(database_path, context, payload, request_id)}


def _tool_event_update(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    event_id = required_text(payload, "event_id")
    changes = dict(payload.get("changes") or {})
    return {"event": cal.update_event(database_path, context, event_id, changes, request_id)}


def _tool_event_cancel(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    return {"event": cal.event_action(database_path, context, required_text(payload, "event_id"), "cancel", request_id, payload)}


def _tool_note_create(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    return {"note": notes.create_note(database_path, context, payload, request_id)}


def _tool_note_update(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    note_id = required_text(payload, "note_id")
    changes = dict(payload.get("changes") or {})
    return {"note": notes.update_note(database_path, context, note_id, changes, request_id)}


def _tool_followup_create(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    return {"followup": prod.create_followup(database_path, context, payload, request_id)}


def _tool_followup_update(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    followup_id = required_text(payload, "followup_id")
    changes = dict(payload.get("changes") or {})
    return {"followup": prod.update_followup(database_path, context, followup_id, changes, request_id)}


def _verify_task(database_path: Path, context: AuthenticatedContext, output: dict[str, Any]) -> dict[str, Any]:
    task_id = output.get("task", {}).get("id")
    task = prod.get_task(database_path, context, str(task_id)) if task_id else None
    return verification("TASK", task)


def _verify_reminder(database_path: Path, context: AuthenticatedContext, output: dict[str, Any]) -> dict[str, Any]:
    reminder_id = output.get("reminder", {}).get("id")
    reminder = prod.get_reminder(database_path, context, str(reminder_id)) if reminder_id else None
    return verification("REMINDER", reminder)


def _verify_event(database_path: Path, context: AuthenticatedContext, output: dict[str, Any]) -> dict[str, Any]:
    event_id = output.get("event", {}).get("id")
    event = cal.get_event(database_path, context, str(event_id)) if event_id else None
    return verification("CALENDAR_EVENT", event)


def _verify_note(database_path: Path, context: AuthenticatedContext, output: dict[str, Any]) -> dict[str, Any]:
    note_id = output.get("note", {}).get("id")
    note = notes.get_note(database_path, context, str(note_id)) if note_id else None
    return verification("NOTE", note)


def _verify_followup(database_path: Path, context: AuthenticatedContext, output: dict[str, Any]) -> dict[str, Any]:
    followup_id = output.get("followup", {}).get("id")
    followup = prod.get_followup(database_path, context, str(followup_id)) if followup_id else None
    return verification("FOLLOW_UP", followup)


WRITE_TOOLS: dict[str, WriteTool] = {
    "task.create": WriteTool("task.create", "Create a task.", "LOW", True, {"title": "string"}, {"task": "object"}, _tool_task_create, _verify_task, "DELETE_CREATED_RECORD"),
    "task.update": WriteTool("task.update", "Update a task.", "MEDIUM", True, {"task_id": "uuid", "changes": "object"}, {"task": "object"}, _tool_task_update, _verify_task, "RESTORE_PREVIOUS_STATE"),
    "task.complete": WriteTool("task.complete", "Complete a task.", "LOW", True, {"task_id": "uuid"}, {"task": "object"}, _tool_task_complete, _verify_task, "REOPEN_TASK"),
    "reminder.create": WriteTool("reminder.create", "Create a reminder.", "LOW", True, {"title": "string", "scheduled_at": "iso8601"}, {"reminder": "object"}, _tool_reminder_create, _verify_reminder, "DELETE_CREATED_RECORD"),
    "reminder.update": WriteTool("reminder.update", "Snooze a reminder.", "MEDIUM", False, {"reminder_id": "uuid"}, {"reminder": "object"}, _tool_reminder_update, _verify_reminder, "UNAVAILABLE"),
    "reminder.cancel": WriteTool("reminder.cancel", "Cancel a reminder.", "MEDIUM", False, {"reminder_id": "uuid"}, {"reminder": "object"}, _tool_reminder_cancel, _verify_reminder, "UNAVAILABLE"),
    "calendar.event.create": WriteTool("calendar.event.create", "Create a calendar event.", "MEDIUM", True, {"title": "string", "start_at": "iso8601", "end_at": "iso8601"}, {"event": "object"}, _tool_event_create, _verify_event, "DELETE_CREATED_RECORD"),
    "calendar.event.update": WriteTool("calendar.event.update", "Update a calendar event.", "MEDIUM", True, {"event_id": "uuid", "changes": "object"}, {"event": "object"}, _tool_event_update, _verify_event, "RESTORE_EVENT"),
    "calendar.event.cancel": WriteTool("calendar.event.cancel", "Cancel a calendar event.", "MEDIUM", True, {"event_id": "uuid"}, {"event": "object"}, _tool_event_cancel, _verify_event, "RESTORE_EVENT"),
    "note.create": WriteTool("note.create", "Create a note.", "LOW", True, {"title": "string", "content_markdown": "string"}, {"note": "object"}, _tool_note_create, _verify_note, "DELETE_CREATED_RECORD"),
    "note.update": WriteTool("note.update", "Update a note.", "MEDIUM", True, {"note_id": "uuid", "changes": "object"}, {"note": "object"}, _tool_note_update, _verify_note, "RESTORE_PREVIOUS_STATE"),
    "followup.create": WriteTool("followup.create", "Create a follow-up.", "LOW", True, {"title": "string"}, {"followup": "object"}, _tool_followup_create, _verify_followup, "DELETE_CREATED_RECORD"),
    "followup.update": WriteTool("followup.update", "Update a follow-up.", "MEDIUM", True, {"followup_id": "uuid", "changes": "object"}, {"followup": "object"}, _tool_followup_update, _verify_followup, "RESTORE_PREVIOUS_STATE"),
}


def create_proposal(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    tool_name = str(payload.get("tool_name") or "").strip()
    if not tool_name and payload.get("message"):
        payload = proposal_payload_from_message(payload)
        tool_name = str(payload.get("tool_name", ""))
    tool = get_write_tool(tool_name)
    input_payload = dict(payload.get("input_payload") or {})
    title = str(payload.get("title") or proposal_title(tool_name, input_payload)).strip()
    summary = str(payload.get("summary") or proposal_summary(tool_name, input_payload)).strip()
    now = utc_now()
    expires_at = payload.get("expires_at") or (now + timedelta(minutes=int(payload.get("expires_in_minutes", 15)))).replace(microsecond=0).isoformat()
    proposal_id = str(uuid.uuid4())
    after_state = {"tool_name": tool_name, "input_payload": input_payload}
    expected_changes = payload.get("expected_changes") or [summary]
    risks = payload.get("risks") or ["This action changes local application state after approval."]
    reversibility = payload.get("reversibility") or (tool.rollback_strategy if tool.reversible else "Rollback unavailable")
    idempotency_key = str(payload.get("idempotency_key") or stable_idempotency_key(context.user["id"], tool_name, input_payload))
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO action_proposals(
                  id, request_id, plan_id, user_id, tool_name, title, summary, affected_records,
                  before_state, after_state, expected_changes, risks, reversibility, authority_level,
                  requires_confirmation, estimated_execution_time_ms, status, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'AWAITING_CONFIRMATION', ?)
                """,
                (
                    proposal_id,
                    payload.get("request_id"),
                    payload.get("plan_id"),
                    context.user["id"],
                    tool_name,
                    title,
                    summary,
                    json.dumps(payload.get("affected_records") or []),
                    json.dumps(payload.get("before_state") or {}),
                    json.dumps(after_state),
                    json.dumps(expected_changes),
                    json.dumps(risks),
                    reversibility,
                    tool.authority,
                    int(payload.get("estimated_execution_time_ms", 1000)),
                    expires_at,
                ),
            )
            append_history(connection, proposal_id, context.user["id"], "ACTION_PROPOSED", summary, {"idempotency_key": idempotency_key})
    audit(database_path, "ACTION_PROPOSED", context, request_id, "ACTION_PROPOSAL", proposal_id, {"tool_name": tool_name})
    return get_proposal(database_path, context, proposal_id)


def proposal_payload_from_message(payload: dict[str, Any]) -> dict[str, Any]:
    message = str(payload.get("message", "")).strip()
    lowered = message.lower()
    if "remind" in lowered:
        title = cleanup_requested_title(message, ["remind me to", "reminder", "create reminder"])
        scheduled_at = payload.get("scheduled_at") or (utc_now() + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0).isoformat()
        return payload | {"tool_name": "reminder.create", "input_payload": {"title": title, "scheduled_at": scheduled_at}}
    if "note" in lowered:
        title = cleanup_requested_title(message, ["create note", "note"])
        return payload | {"tool_name": "note.create", "input_payload": {"title": title, "content_markdown": ""}}
    return payload | {"tool_name": "task.create", "input_payload": {"title": cleanup_requested_title(message, ["create task", "task", "todo"])}}


def approve_proposal(database_path: Path, context: AuthenticatedContext, proposal_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    proposal = ensure_actionable_proposal(database_path, context, proposal_id)
    confirmation_text = str(payload.get("confirmation_text", payload.get("confirm", ""))).strip().upper()
    if confirmation_text not in {"APPROVE", "APPROVED"}:
        raise AuthError("CONFIRMATION_REQUIRED", "Type APPROVE to authorize this proposal.", 400)
    token = secrets.token_urlsafe(32)
    token_id = str(uuid.uuid4())
    expires_at = (utc_now() + timedelta(minutes=10)).replace(microsecond=0).isoformat()
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "UPDATE action_proposals SET status = 'APPROVED', approved_at = ?, updated_at = ? WHERE id = ?",
                (iso_now(), iso_now(), proposal_id),
            )
            connection.execute(
                "INSERT INTO confirmations(id, proposal_id, decision, user_id, note) VALUES (?, ?, 'APPROVED', ?, ?)",
                (str(uuid.uuid4()), proposal_id, context.user["id"], text_or_none(payload.get("note"))),
            )
            connection.execute(
                "INSERT INTO action_tokens(id, proposal_id, token_hash, expires_at, status) VALUES (?, ?, ?, ?, 'ACTIVE')",
                (token_id, proposal_id, hash_token(token), expires_at),
            )
            append_history(connection, proposal_id, context.user["id"], "ACTION_APPROVED", "Proposal approved.", {"token_id": token_id})
    audit(database_path, "ACTION_APPROVED", context, request_id, "ACTION_PROPOSAL", proposal_id)
    return {"proposal": get_proposal(database_path, context, proposal_id), "action_token": token, "action_token_expires_at": expires_at}


def reject_proposal(database_path: Path, context: AuthenticatedContext, proposal_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    proposal = get_proposal(database_path, context, proposal_id)
    if proposal["status"] in {"COMPLETED", "EXECUTING", "ROLLED_BACK"}:
        raise AuthError("PROPOSAL_LOCKED", "This proposal can no longer be rejected.", 409)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute("UPDATE action_proposals SET status = 'REJECTED', updated_at = ? WHERE id = ?", (iso_now(), proposal_id))
            connection.execute(
                "INSERT INTO confirmations(id, proposal_id, decision, user_id, note) VALUES (?, ?, 'REJECTED', ?, ?)",
                (str(uuid.uuid4()), proposal_id, context.user["id"], text_or_none(payload.get("note"))),
            )
            append_history(connection, proposal_id, context.user["id"], "ACTION_REJECTED", "Proposal rejected.", {})
    audit(database_path, "ACTION_REJECTED", context, request_id, "ACTION_PROPOSAL", proposal_id)
    return get_proposal(database_path, context, proposal_id)


def execute(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    proposal_id = required_text(payload, "proposal_id")
    proposal = get_proposal(database_path, context, proposal_id)
    tool = get_write_tool(proposal["tool_name"])
    input_payload = dict(proposal["after_state"].get("input_payload") or {})
    idempotency_key = str(payload.get("idempotency_key") or stable_idempotency_key(context.user["id"], tool.name, input_payload))
    existing = get_execution_by_idempotency(database_path, context, idempotency_key)
    if existing:
        return existing | {"idempotent_replay": True}
    if proposal["status"] != "APPROVED":
        raise AuthError("APPROVAL_REQUIRED", "Proposal must be approved before execution.", 409)
    if parse_iso(proposal["expires_at"]) <= utc_now():
        expire_proposal(database_path, context, proposal_id)
        raise AuthError("PROPOSAL_EXPIRED", "Proposal expired before execution.", 409)
    token_row = validate_action_token(database_path, proposal_id, required_text(payload, "action_token"))

    execution_id = str(uuid.uuid4())
    start = time.perf_counter()
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO executions(
                  id, proposal_id, user_id, tool_name, input_payload, output_payload, status,
                  verification_status, idempotency_key, action_token_id, started_at
                ) VALUES (?, ?, ?, ?, ?, '{}', 'EXECUTING', 'PENDING', ?, ?, ?)
                """,
                (execution_id, proposal_id, context.user["id"], tool.name, json.dumps(input_payload), idempotency_key, token_row["id"], iso_now()),
            )
            connection.execute("UPDATE action_proposals SET status = 'EXECUTING', updated_at = ? WHERE id = ?", (iso_now(), proposal_id))
            connection.execute("UPDATE action_tokens SET status = 'USED', used_at = ? WHERE id = ?", (iso_now(), token_row["id"]))

    try:
        output = tool.executor(database_path, context, input_payload, request_id)
        verify_start = time.perf_counter()
        verification_result = tool.verifier(database_path, context, output)
        verification_ms = int((time.perf_counter() - verify_start) * 1000)
        if verification_result["status"] != "VERIFIED":
            raise AuthError("VERIFICATION_FAILED", "Execution completed but verification failed.", 500)
        execution_ms = int((time.perf_counter() - start) * 1000)
        record_execution_success(database_path, context, proposal_id, execution_id, output, verification_result, tool, execution_ms, verification_ms)
    except Exception as exc:
        record_execution_failure(database_path, context, proposal_id, execution_id, tool.name, exc)
        if isinstance(exc, AuthError):
            raise
        raise AuthError("EXECUTION_FAILED", "Action execution failed.", 500) from exc
    audit(database_path, "ACTION_EXECUTED", context, request_id, "ACTION_EXECUTION", execution_id, {"tool_name": tool.name})
    audit(database_path, "ACTION_VERIFIED", context, request_id, "ACTION_EXECUTION", execution_id)
    return get_execution(database_path, context, execution_id)


def rollback(database_path: Path, context: AuthenticatedContext, execution_id: str, request_id: str) -> dict[str, Any]:
    execution = get_execution(database_path, context, execution_id)
    rows = rollback_rows(database_path, execution_id)
    if not rows or rows[0]["status"] != "AVAILABLE":
        raise AuthError("ROLLBACK_UNAVAILABLE", "Rollback unavailable for this execution.", 409)
    record = dict(rows[0])
    tool_name = execution["tool_name"]
    output = execution["output_payload"]
    try:
        if record["strategy"] == "DELETE_CREATED_RECORD" and tool_name == "task.create":
            prod.delete_task(database_path, context, str(output["task"]["id"]), request_id)
        elif record["strategy"] == "DELETE_CREATED_RECORD" and tool_name == "calendar.event.create":
            cal.delete_event(database_path, context, str(output["event"]["id"]), request_id)
        elif record["strategy"] == "DELETE_CREATED_RECORD" and tool_name == "note.create":
            notes.delete_note(database_path, context, str(output["note"]["id"]), request_id)
        elif record["strategy"] == "REOPEN_TASK" and tool_name == "task.complete":
            prod.transition_task(database_path, context, str(output["task"]["id"]), "PLANNED", request_id)
        else:
            raise AuthError("ROLLBACK_UNAVAILABLE", "Rollback unavailable for this execution.", 409)
        with closing(connect(database_path)) as connection:
            with connection:
                connection.execute("UPDATE rollback_records SET status = 'SUCCEEDED', completed_at = ? WHERE id = ?", (iso_now(), record["id"]))
                connection.execute("UPDATE executions SET status = 'ROLLED_BACK', updated_at = ? WHERE id = ?", (iso_now(), execution_id))
                connection.execute("UPDATE action_proposals SET status = 'ROLLED_BACK', updated_at = ? WHERE id = ?", (iso_now(), execution["proposal_id"]))
                append_history(connection, execution["proposal_id"], context.user["id"], "ACTION_ROLLED_BACK", "Rollback completed.", {"execution_id": execution_id})
    except Exception as exc:
        with closing(connect(database_path)) as connection:
            with connection:
                connection.execute("UPDATE rollback_records SET status = 'FAILED', error_code = ? WHERE id = ?", (exc.__class__.__name__, record["id"]))
        raise
    audit(database_path, "ACTION_ROLLED_BACK", context, request_id, "ACTION_EXECUTION", execution_id)
    return get_execution(database_path, context, execution_id)


def list_proposals(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    expire_due_proposals(database_path, context)
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            "SELECT * FROM action_proposals WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
            (context.user["id"],),
        ).fetchall()
    return [proposal_dict(database_path, row) for row in rows]


def get_proposal(database_path: Path, context: AuthenticatedContext, proposal_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute(
            "SELECT * FROM action_proposals WHERE id = ? AND user_id = ?",
            (proposal_id, context.user["id"]),
        ).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Proposal not found.", 404)
    proposal = proposal_dict(database_path, row)
    if proposal["status"] == "AWAITING_CONFIRMATION" and parse_iso(proposal["expires_at"]) <= utc_now():
        expire_proposal(database_path, context, proposal_id)
        return get_proposal(database_path, context, proposal_id)
    return proposal


def list_executions(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            "SELECT * FROM executions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
            (context.user["id"],),
        ).fetchall()
    return [execution_dict(database_path, row) for row in rows]


def get_execution(database_path: Path, context: AuthenticatedContext, execution_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute(
            "SELECT * FROM executions WHERE id = ? AND user_id = ?",
            (execution_id, context.user["id"]),
        ).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Execution not found.", 404)
    return execution_dict(database_path, row)


def list_execution_metrics(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            "SELECT * FROM execution_metrics WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
            (context.user["id"],),
        ).fetchall()
    return [dict(row) for row in rows]


def record_execution_success(
    database_path: Path,
    context: AuthenticatedContext,
    proposal_id: str,
    execution_id: str,
    output: dict[str, Any],
    verification_result: dict[str, Any],
    tool: WriteTool,
    execution_ms: int,
    verification_ms: int,
) -> None:
    resource = verification_result["resource"]
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                UPDATE executions
                SET output_payload = ?, status = 'VERIFIED', verification_status = 'VERIFIED',
                    completed_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (json.dumps(output), iso_now(), iso_now(), execution_id),
            )
            connection.execute("UPDATE action_proposals SET status = 'COMPLETED', executed_at = ?, updated_at = ? WHERE id = ?", (iso_now(), iso_now(), proposal_id))
            connection.execute(
                """
                INSERT INTO rollback_records(
                  id, execution_id, proposal_id, strategy, status, resource_type, resource_id, after_state
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()),
                    execution_id,
                    proposal_id,
                    tool.rollback_strategy,
                    "AVAILABLE" if tool.reversible else "UNAVAILABLE",
                    verification_result["resource_type"],
                    resource.get("id"),
                    json.dumps(resource),
                ),
            )
            append_history(connection, proposal_id, context.user["id"], "ACTION_EXECUTED", "Action executed.", {"execution_id": execution_id})
            append_history(connection, proposal_id, context.user["id"], "ACTION_VERIFIED", "Execution verified.", verification_result)
            connection.execute(
                """
                INSERT INTO execution_metrics(id, proposal_id, execution_id, user_id, execution_time_ms,
                  verification_time_ms, status, tool_name)
                VALUES (?, ?, ?, ?, ?, ?, 'SUCCEEDED', ?)
                """,
                (str(uuid.uuid4()), proposal_id, execution_id, context.user["id"], execution_ms, verification_ms, tool.name),
            )


def record_execution_failure(database_path: Path, context: AuthenticatedContext, proposal_id: str, execution_id: str, tool_name: str, exc: Exception) -> None:
    code = exc.code if isinstance(exc, AuthError) else exc.__class__.__name__
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                UPDATE executions
                SET status = 'FAILED', verification_status = 'UNKNOWN', error_code = ?, error_message = ?,
                    completed_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (code, str(exc), iso_now(), iso_now(), execution_id),
            )
            connection.execute("UPDATE action_proposals SET status = 'FAILED', updated_at = ? WHERE id = ?", (iso_now(), proposal_id))
            append_history(connection, proposal_id, context.user["id"], "ACTION_FAILED", str(exc), {"error_code": code})
            connection.execute(
                """
                INSERT INTO execution_metrics(id, proposal_id, execution_id, user_id, status, tool_name, error_code)
                VALUES (?, ?, ?, ?, 'FAILED', ?, ?)
                """,
                (str(uuid.uuid4()), proposal_id, execution_id, context.user["id"], tool_name, code),
            )


def validate_action_token(database_path: Path, proposal_id: str, token: str) -> Any:
    digest = hash_token(token)
    with closing(connect(database_path)) as connection:
        row = connection.execute(
            "SELECT * FROM action_tokens WHERE proposal_id = ? AND token_hash = ?",
            (proposal_id, digest),
        ).fetchone()
    if not row:
        raise AuthError("INVALID_ACTION_TOKEN", "Action token is invalid.", 403)
    if row["status"] != "ACTIVE":
        raise AuthError("ACTION_TOKEN_USED", "Action token has already been used.", 409)
    if parse_iso(row["expires_at"]) <= utc_now():
        with closing(connect(database_path)) as connection:
            with connection:
                connection.execute("UPDATE action_tokens SET status = 'EXPIRED' WHERE id = ?", (row["id"],))
        raise AuthError("ACTION_TOKEN_EXPIRED", "Action token expired.", 409)
    return row


def ensure_actionable_proposal(database_path: Path, context: AuthenticatedContext, proposal_id: str) -> dict[str, Any]:
    proposal = get_proposal(database_path, context, proposal_id)
    if proposal["status"] != "AWAITING_CONFIRMATION":
        raise AuthError("PROPOSAL_NOT_CONFIRMABLE", "Proposal is not awaiting confirmation.", 409)
    if parse_iso(proposal["expires_at"]) <= utc_now():
        expire_proposal(database_path, context, proposal_id)
        raise AuthError("PROPOSAL_EXPIRED", "Proposal expired.", 409)
    return proposal


def expire_due_proposals(database_path: Path, context: AuthenticatedContext) -> None:
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            """
            SELECT id FROM action_proposals
            WHERE user_id = ? AND status = 'AWAITING_CONFIRMATION' AND expires_at <= ?
            """,
            (context.user["id"], iso_now()),
        ).fetchall()
    for row in rows:
        expire_proposal(database_path, context, row["id"])


def expire_proposal(database_path: Path, context: AuthenticatedContext, proposal_id: str) -> None:
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute("UPDATE action_proposals SET status = 'EXPIRED', updated_at = ? WHERE id = ?", (iso_now(), proposal_id))
            connection.execute("UPDATE action_tokens SET status = 'EXPIRED' WHERE proposal_id = ? AND status = 'ACTIVE'", (proposal_id,))
            append_history(connection, proposal_id, context.user["id"], "ACTION_EXPIRED", "Proposal expired.", {})


def get_execution_by_idempotency(database_path: Path, context: AuthenticatedContext, idempotency_key: str) -> dict[str, Any] | None:
    with closing(connect(database_path)) as connection:
        row = connection.execute(
            "SELECT * FROM executions WHERE user_id = ? AND idempotency_key = ?",
            (context.user["id"], idempotency_key),
        ).fetchone()
    return execution_dict(database_path, row) if row else None


def proposal_dict(database_path: Path, row: Any) -> dict[str, Any]:
    proposal_id = row["id"]
    with closing(connect(database_path)) as connection:
        confirmations = connection.execute("SELECT * FROM confirmations WHERE proposal_id = ? ORDER BY confirmed_at DESC", (proposal_id,)).fetchall()
        history = connection.execute("SELECT * FROM approval_history WHERE proposal_id = ? ORDER BY created_at", (proposal_id,)).fetchall()
        executions = connection.execute("SELECT * FROM executions WHERE proposal_id = ? ORDER BY created_at DESC", (proposal_id,)).fetchall()
    return dict(row) | {
        "requires_confirmation": bool(row["requires_confirmation"]),
        "affected_records": json.loads(row["affected_records"]),
        "before_state": json.loads(row["before_state"]),
        "after_state": json.loads(row["after_state"]),
        "expected_changes": json.loads(row["expected_changes"]),
        "risks": json.loads(row["risks"]),
        "confirmations": [dict(item) for item in confirmations],
        "history": [history_dict(item) for item in history],
        "executions": [execution_dict(database_path, item, include_proposal=False) for item in executions],
    }


def execution_dict(database_path: Path, row: Any, include_proposal: bool = True) -> dict[str, Any]:
    data = dict(row) | {
        "input_payload": json.loads(row["input_payload"]),
        "output_payload": json.loads(row["output_payload"]),
        "rollback_records": [dict(item) for item in rollback_rows(database_path, row["id"])],
    }
    if include_proposal:
        data["proposal"] = compact_proposal(database_path, row["proposal_id"])
    return data


def compact_proposal(database_path: Path, proposal_id: str) -> dict[str, Any] | None:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT id, title, status, tool_name FROM action_proposals WHERE id = ?", (proposal_id,)).fetchone()
    return dict(row) if row else None


def rollback_rows(database_path: Path, execution_id: str) -> list[Any]:
    with closing(connect(database_path)) as connection:
        return connection.execute("SELECT * FROM rollback_records WHERE execution_id = ? ORDER BY created_at DESC", (execution_id,)).fetchall()


def history_dict(row: Any) -> dict[str, Any]:
    return dict(row) | {"metadata": json.loads(row["metadata"])}


def append_history(connection: Any, proposal_id: str, user_id: str, event_type: str, note: str, metadata: dict[str, Any]) -> None:
    connection.execute(
        "INSERT INTO approval_history(id, proposal_id, user_id, event_type, note, metadata) VALUES (?, ?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), proposal_id, user_id, event_type, note, json.dumps(metadata)),
    )


def audit(
    database_path: Path,
    event_type: str,
    context: AuthenticatedContext,
    request_id: str,
    resource_type: str,
    resource_id: str,
    metadata: dict[str, Any] | None = None,
) -> None:
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
        metadata=metadata,
    )


def get_write_tool(tool_name: str) -> WriteTool:
    tool = WRITE_TOOLS.get(tool_name)
    if not tool:
        raise AuthError("UNSUPPORTED_TOOL", "Unsupported write tool.", 400)
    return tool


def required_text(payload: dict[str, Any], key: str) -> str:
    value = str(payload.get(key, "")).strip()
    if not value:
        raise AuthError("VALIDATION_ERROR", f"{key} is required.", 400)
    return value


def text_or_none(value: Any) -> str | None:
    text = str(value).strip() if value is not None else ""
    return text or None


def verification(resource_type: str, resource: dict[str, Any] | None) -> dict[str, Any]:
    if not resource:
        return {"status": "UNKNOWN", "resource_type": resource_type, "resource": {}}
    return {"status": "VERIFIED", "resource_type": resource_type, "resource": resource}


def stable_idempotency_key(user_id: str, tool_name: str, input_payload: dict[str, Any]) -> str:
    material = json.dumps({"user_id": user_id, "tool_name": tool_name, "input_payload": input_payload}, sort_keys=True)
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def proposal_title(tool_name: str, input_payload: dict[str, Any]) -> str:
    label = input_payload.get("title") or input_payload.get("task_id") or input_payload.get("event_id") or input_payload.get("note_id") or "record"
    return f"{tool_name}: {label}"


def proposal_summary(tool_name: str, input_payload: dict[str, Any]) -> str:
    return f"Run {tool_name} with {len(input_payload)} input field(s)."


def cleanup_requested_title(message: str, prefixes: list[str]) -> str:
    cleaned = message.strip()
    lowered = cleaned.lower()
    for prefix in prefixes:
        if lowered.startswith(prefix):
            cleaned = cleaned[len(prefix) :].strip(" :.-")
            break
    return cleaned or "Untitled action"
