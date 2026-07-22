from __future__ import annotations

import hashlib
import json
import time
import uuid
from contextlib import closing
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from day_to_day_assistant_api import actions, planning
from day_to_day_assistant_api.audit import record_audit_event
from day_to_day_assistant_api.auth import AuthError, AuthenticatedContext, iso_now, parse_iso, utc_now
from day_to_day_assistant_api.database import connect
from day_to_day_assistant_api.productivity import list_followups, list_reminders, list_tasks, record_activity, today


AUTOMATION_STATUSES = {"ACTIVE", "PAUSED", "DISABLED", "ARCHIVED"}
TRIGGER_TYPES = {"TIME", "DATE", "TASK_COMPLETED", "EVENT_COMPLETED", "FOLLOW_UP_DUE", "REMINDER_TRIGGERED", "SYSTEM_START", "MANUAL"}
STEP_TYPES = {"READ", "SEARCH", "PLAN", "CREATE", "UPDATE", "DELETE", "WAIT", "CONDITION", "NOTIFY"}


def create_automation(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    template_payload = payload_from_template(database_path, payload.get("template_id"), context)
    merged = template_payload | payload
    trigger_config = dict(merged.get("trigger") or merged.get("trigger_configuration") or {"type": "MANUAL"})
    trigger_type = validate_trigger_type(trigger_config.get("type", "MANUAL"))
    workflow_steps = list(merged.get("steps") or merged.get("workflow_steps") or [])
    if not workflow_steps:
        workflow_steps = [{"step_type": "NOTIFY", "name": "Record automation run", "configuration": {"message": "Automation completed."}}]
    automation_id = str(uuid.uuid4())
    trigger_id = str(uuid.uuid4())
    workflow_id = str(uuid.uuid4())
    now = iso_now()
    next_run = compute_initial_next_run(trigger_config, context, now)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "INSERT INTO triggers(id, user_id, type, configuration, enabled) VALUES (?, ?, ?, ?, 1)",
                (trigger_id, context.user["id"], trigger_type, json.dumps(trigger_config)),
            )
            connection.execute(
                "INSERT INTO workflows(id, user_id, name, timeout_seconds, rollback_strategy) VALUES (?, ?, ?, ?, ?)",
                (workflow_id, context.user["id"], str(merged.get("workflow_name") or merged.get("name") or "Automation Workflow"), int(merged.get("timeout_seconds", 60)), str(merged.get("rollback_strategy", "BEST_EFFORT"))),
            )
            insert_steps(connection, workflow_id, workflow_steps)
            connection.execute(
                """
                INSERT INTO automations(
                  id, user_id, name, description, automation_type, authority_level, trigger_id, workflow_id,
                  status, enabled, read_scope, write_scope, confirmation_policy, catch_up_policy, expires_at,
                  next_run_at, retry_limit
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    automation_id,
                    context.user["id"],
                    required_text(merged, "name"),
                    text_or_none(merged.get("description")),
                    str(merged.get("automation_type", "ROUTINE")),
                    validate_authority(merged.get("authority_level", "LOW")),
                    trigger_id,
                    workflow_id,
                    json.dumps(merged.get("read_scope") or []),
                    json.dumps(merged.get("write_scope") or []),
                    str(merged.get("confirmation_policy", "AUTOMATION_APPROVED")),
                    str(merged.get("catch_up_policy", "SKIP_MISSED")),
                    text_or_none(merged.get("expires_at")),
                    next_run,
                    int(merged.get("retry_limit", 1)),
                ),
            )
            if next_run:
                upsert_scheduler_job(connection, automation_id, context.user["id"], next_run)
    audit(database_path, "AUTOMATION_CREATED", context, request_id, "AUTOMATION", automation_id)
    activity(database_path, context, "AUTOMATION_CREATED", "AUTOMATION", automation_id, f"Created automation {merged['name']}")
    return get_automation(database_path, context, automation_id)


def update_automation(database_path: Path, context: AuthenticatedContext, automation_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    current = get_automation(database_path, context, automation_id)
    if current["status"] == "ARCHIVED":
        raise AuthError("AUTOMATION_ARCHIVED", "Archived automations cannot be edited.", 409)
    trigger_config = dict(payload.get("trigger") or current["trigger"]["configuration"])
    next_run = compute_initial_next_run(trigger_config, context, iso_now()) if current["status"] == "ACTIVE" else current["next_run_at"]
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "UPDATE triggers SET type = ?, configuration = ?, enabled = ?, updated_at = ? WHERE id = ?",
                (validate_trigger_type(trigger_config.get("type", current["trigger"]["type"])), json.dumps(trigger_config), 1 if bool(payload.get("trigger_enabled", True)) else 0, iso_now(), current["trigger_id"]),
            )
            connection.execute(
                """
                UPDATE automations
                SET name = ?, description = ?, automation_type = ?, authority_level = ?, read_scope = ?,
                    write_scope = ?, confirmation_policy = ?, catch_up_policy = ?, expires_at = ?,
                    next_run_at = ?, retry_limit = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (
                    str(payload.get("name", current["name"])).strip(),
                    text_or_none(payload.get("description", current["description"])),
                    str(payload.get("automation_type", current["automation_type"])),
                    validate_authority(payload.get("authority_level", current["authority_level"])),
                    json.dumps(payload.get("read_scope", current["read_scope"])),
                    json.dumps(payload.get("write_scope", current["write_scope"])),
                    str(payload.get("confirmation_policy", current["confirmation_policy"])),
                    str(payload.get("catch_up_policy", current["catch_up_policy"])),
                    text_or_none(payload.get("expires_at", current["expires_at"])),
                    next_run,
                    int(payload.get("retry_limit", current["retry_limit"])),
                    iso_now(),
                    automation_id,
                    context.user["id"],
                ),
            )
            if "steps" in payload:
                connection.execute("DELETE FROM workflow_steps WHERE workflow_id = ?", (current["workflow_id"],))
                insert_steps(connection, current["workflow_id"], list(payload["steps"]))
            if next_run:
                upsert_scheduler_job(connection, automation_id, context.user["id"], next_run)
    audit(database_path, "AUTOMATION_UPDATED", context, request_id, "AUTOMATION", automation_id)
    return get_automation(database_path, context, automation_id)


def automation_action(database_path: Path, context: AuthenticatedContext, automation_id: str, action: str, request_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = payload or {}
    current = get_automation(database_path, context, automation_id)
    now = iso_now()
    if action == "pause":
        status = "PAUSED"
        event = "AUTOMATION_DISABLED"
    elif action == "resume":
        status = "ACTIVE"
        event = "AUTOMATION_ENABLED"
    elif action == "disable":
        status = "DISABLED"
        event = "AUTOMATION_DISABLED"
    elif action == "archive":
        status = "ARCHIVED"
        event = "AUTOMATION_DISABLED"
    elif action == "run":
        return {"automation": current, "execution": run_automation(database_path, context, automation_id, request_id, payload | {"trigger_type": "MANUAL"})}
    else:
        raise AuthError("VALIDATION_ERROR", "Unsupported automation action.", 400)
    next_run = compute_next_run(current["trigger"]["configuration"], context, now) if status == "ACTIVE" else None
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "UPDATE automations SET status = ?, enabled = ?, disabled_at = ?, archived_at = ?, next_run_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
                (
                    status,
                    1 if status == "ACTIVE" else 0,
                    now if status in {"PAUSED", "DISABLED"} else current["disabled_at"],
                    now if status == "ARCHIVED" else current["archived_at"],
                    next_run,
                    now,
                    automation_id,
                    context.user["id"],
                ),
            )
            if next_run:
                upsert_scheduler_job(connection, automation_id, context.user["id"], next_run)
    audit(database_path, event, context, request_id, "AUTOMATION", automation_id)
    activity(database_path, context, event, "AUTOMATION", automation_id, f"{action.title()} automation {current['name']}")
    return get_automation(database_path, context, automation_id)


def run_automation(database_path: Path, context: AuthenticatedContext, automation_id: str, request_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = payload or {}
    automation = get_automation(database_path, context, automation_id)
    if automation["status"] != "ACTIVE" or not automation["enabled"]:
        return record_skipped_execution(database_path, context, automation, payload, "AUTOMATION_NOT_ACTIVE")
    if automation["expires_at"] and parse_iso(automation["expires_at"]) <= utc_now():
        automation_action(database_path, context, automation_id, "disable", request_id)
        return record_skipped_execution(database_path, context, automation, payload, "AUTOMATION_EXPIRED")
    scheduled_for = str(payload.get("scheduled_for") or automation.get("next_run_at") or iso_now())
    trigger_type = str(payload.get("trigger_type") or automation["trigger"]["type"])
    idempotency_key = stable_key(context.user["id"], automation_id, scheduled_for, trigger_type)
    existing = get_execution_by_key(database_path, context, idempotency_key)
    if existing:
        return existing | {"idempotent_replay": True}
    execution_id = str(uuid.uuid4())
    start = time.perf_counter()
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO automation_executions(id, automation_id, user_id, trigger_type, trigger_payload, status, started_at, idempotency_key)
                VALUES (?, ?, ?, ?, ?, 'RUNNING', ?, ?)
                """,
                (execution_id, automation_id, context.user["id"], trigger_type, json.dumps(payload), iso_now(), idempotency_key),
            )
            connection.execute("UPDATE scheduler_jobs SET status = 'RUNNING', execution_id = ?, updated_at = ? WHERE automation_id = ? AND idempotency_key = ?", (execution_id, iso_now(), automation_id, idempotency_key))
    try:
        results = execute_workflow(database_path, context, automation, execution_id, request_id)
        duration = int((time.perf_counter() - start) * 1000)
        completed = iso_now()
        next_run = compute_next_run(automation["trigger"]["configuration"], context, completed)
        with closing(connect(database_path)) as connection:
            with connection:
                connection.execute("UPDATE automation_executions SET status = 'COMPLETED', completed_at = ?, duration_ms = ?, updated_at = ? WHERE id = ?", (completed, duration, completed, execution_id))
                connection.execute("UPDATE automations SET last_run_at = ?, next_run_at = ?, updated_at = ? WHERE id = ?", (completed, next_run, completed, automation_id))
                connection.execute("UPDATE scheduler_jobs SET status = 'COMPLETED', execution_id = ?, updated_at = ? WHERE automation_id = ? AND idempotency_key = ?", (execution_id, completed, automation_id, idempotency_key))
                if next_run:
                    upsert_scheduler_job(connection, automation_id, context.user["id"], next_run)
    except Exception as exc:
        status_failed(database_path, context, automation, execution_id, idempotency_key, exc)
        raise
    audit(database_path, "AUTOMATION_EXECUTED", context, request_id, "AUTOMATION", automation_id, {"execution_id": execution_id})
    activity(database_path, context, "AUTOMATION_EXECUTED", "AUTOMATION", automation_id, f"{automation['name']} completed.")
    execution = get_execution(database_path, context, execution_id)
    return execution | {"step_results": results}


def execute_workflow(database_path: Path, context: AuthenticatedContext, automation: dict[str, Any], execution_id: str, request_id: str) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for step in automation["workflow"]["steps"]:
        step_execution_id = str(uuid.uuid4())
        with closing(connect(database_path)) as connection:
            with connection:
                connection.execute(
                    "INSERT INTO automation_step_executions(id, execution_id, step_id, position, status, started_at) VALUES (?, ?, ?, ?, 'RUNNING', ?)",
                    (step_execution_id, execution_id, step["id"], step["position"], iso_now()),
                )
        try:
            result = execute_step(database_path, context, automation, step, execution_id, request_id)
            with closing(connect(database_path)) as connection:
                with connection:
                    connection.execute(
                        """
                        UPDATE automation_step_executions
                        SET status = 'COMPLETED', result = ?, action_proposal_id = ?, action_execution_id = ?,
                            attempt_count = 1, completed_at = ?
                        WHERE id = ?
                        """,
                        (json.dumps(result), result.get("action_proposal_id"), result.get("action_execution_id"), iso_now(), step_execution_id),
                    )
            results.append(result)
        except Exception as exc:
            with closing(connect(database_path)) as connection:
                with connection:
                    connection.execute(
                        "UPDATE automation_step_executions SET status = 'FAILED', attempt_count = 1, error_code = ?, error_message = ?, completed_at = ? WHERE id = ?",
                        (error_code(exc), str(exc), iso_now(), step_execution_id),
                    )
            raise
    return results


def execute_step(database_path: Path, context: AuthenticatedContext, automation: dict[str, Any], step: dict[str, Any], execution_id: str, request_id: str) -> dict[str, Any]:
    config = dict(step["configuration"])
    step_type = step["step_type"]
    if step_type == "READ":
        source = str(config.get("source", "today"))
        if source == "today":
            return {"source": source, "records": today(database_path, context)}
        if source == "tasks":
            return {"source": source, "records": list_tasks(database_path, context)}
        if source == "reminders":
            return {"source": source, "records": list_reminders(database_path, context)}
        if source == "followups":
            return {"source": source, "records": list_followups(database_path, context)}
        return {"source": source, "records": []}
    if step_type == "SEARCH":
        source = str(config.get("source", "tasks"))
        records = list_tasks(database_path, context) if source == "tasks" else list_followups(database_path, context)
        status = config.get("status")
        if status:
            records = [item for item in records if item.get("status") == status]
        return {"source": source, "records": records[:25]}
    if step_type == "PLAN":
        message = str(config.get("message", f"Run automation {automation['name']}"))
        planned = planning.handle_request(database_path, context, {"message": message}, request_id)
        return {"plan_id": planned["plan"]["id"], "request_id": planned["request"]["id"]}
    if step_type in {"CREATE", "UPDATE", "DELETE"}:
        return execute_action_step(database_path, context, automation, step, execution_id, request_id)
    if step_type == "CONDITION":
        return {"condition": config, "passed": bool(config.get("passed", True))}
    if step_type == "WAIT":
        return {"wait_seconds": int(config.get("seconds", 0)), "waited": False}
    if step_type == "NOTIFY":
        message = str(config.get("message", f"{automation['name']} completed."))
        activity(database_path, context, "AUTOMATION_EXECUTED", "AUTOMATION", automation["id"], message)
        return {"notification": message}
    raise AuthError("VALIDATION_ERROR", "Unsupported workflow step.", 400)


def execute_action_step(database_path: Path, context: AuthenticatedContext, automation: dict[str, Any], step: dict[str, Any], execution_id: str, request_id: str) -> dict[str, Any]:
    config = dict(step["configuration"])
    tool_name = required_text(config, "tool_name")
    if automation["confirmation_policy"] != "AUTOMATION_APPROVED":
        raise AuthError("PER_RUN_CONFIRMATION_REQUIRED", "This automation requires per-run confirmation.", 409)
    if automation["write_scope"] and tool_name not in automation["write_scope"]:
        raise AuthError("AUTOMATION_SCOPE_DENIED", "Automation write scope does not allow this tool.", 403)
    proposal = actions.create_proposal(
        database_path,
        context,
        {
            "tool_name": tool_name,
            "title": f"{automation['name']}: {step['name']}",
            "summary": f"Automation-approved {tool_name} step.",
            "input_payload": dict(config.get("input_payload") or {}),
            "idempotency_key": stable_key(context.user["id"], automation["id"], execution_id, step["id"]),
        },
        request_id,
    )
    approval = actions.approve_proposal(database_path, context, proposal["id"], {"confirmation_text": "APPROVE", "note": f"Approved automation {automation['name']}."}, request_id)
    execution = actions.execute(
        database_path,
        context,
        {
            "proposal_id": proposal["id"],
            "action_token": approval["action_token"],
            "idempotency_key": stable_key(context.user["id"], automation["id"], execution_id, step["id"], tool_name),
        },
        request_id,
    )
    return {"action_proposal_id": proposal["id"], "action_execution_id": execution["id"], "status": execution["status"], "tool_name": tool_name}


def run_due_automations(database_path: Path, context: AuthenticatedContext, request_id: str) -> dict[str, Any]:
    recover_scheduler(database_path, context)
    now = iso_now()
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            """
            SELECT * FROM automations
            WHERE user_id = ? AND status = 'ACTIVE' AND enabled = 1
              AND next_run_at IS NOT NULL AND next_run_at <= ?
            ORDER BY next_run_at
            LIMIT 20
            """,
            (context.user["id"], now),
        ).fetchall()
    executions = []
    for row in rows:
        executions.append(run_automation(database_path, context, row["id"], request_id, {"scheduled_for": row["next_run_at"], "trigger_type": "TIME"}))
    return {"executions": executions, "run_count": len(executions)}


def recover_scheduler(database_path: Path, context: AuthenticatedContext) -> None:
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            "SELECT * FROM automations WHERE user_id = ? AND status = 'ACTIVE' AND enabled = 1",
            (context.user["id"],),
        ).fetchall()
        with connection:
            for row in rows:
                if not row["next_run_at"]:
                    next_run = compute_next_run(json.loads(connection.execute("SELECT configuration FROM triggers WHERE id = ?", (row["trigger_id"],)).fetchone()["configuration"]), context, iso_now())
                    connection.execute("UPDATE automations SET next_run_at = ?, updated_at = ? WHERE id = ?", (next_run, iso_now(), row["id"]))
                    if next_run:
                        upsert_scheduler_job(connection, row["id"], context.user["id"], next_run)


def list_automations(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    recover_scheduler(database_path, context)
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM automations WHERE user_id = ? ORDER BY status, name", (context.user["id"],)).fetchall()
    return [automation_dict(database_path, row) for row in rows]


def get_automation(database_path: Path, context: AuthenticatedContext, automation_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM automations WHERE id = ? AND user_id = ?", (automation_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Automation not found.", 404)
    return automation_dict(database_path, row)


def list_executions(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM automation_executions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100", (context.user["id"],)).fetchall()
    return [execution_dict(database_path, row) for row in rows]


def get_execution(database_path: Path, context: AuthenticatedContext, execution_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM automation_executions WHERE id = ? AND user_id = ?", (execution_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Automation execution not found.", 404)
    return execution_dict(database_path, row)


def list_templates(database_path: Path) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM automation_templates ORDER BY name").fetchall()
    return [template_dict(row) for row in rows]


def list_scheduler_jobs(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM scheduler_jobs WHERE user_id = ? ORDER BY scheduled_for LIMIT 100", (context.user["id"],)).fetchall()
    return [dict(row) for row in rows]


def automation_dict(database_path: Path, row: Any) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        trigger = connection.execute("SELECT * FROM triggers WHERE id = ?", (row["trigger_id"],)).fetchone()
        workflow = connection.execute("SELECT * FROM workflows WHERE id = ?", (row["workflow_id"],)).fetchone()
        steps = connection.execute("SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY position", (row["workflow_id"],)).fetchall()
        recent = connection.execute("SELECT * FROM automation_executions WHERE automation_id = ? ORDER BY created_at DESC LIMIT 5", (row["id"],)).fetchall()
    return dict(row) | {
        "enabled": bool(row["enabled"]),
        "read_scope": json.loads(row["read_scope"]),
        "write_scope": json.loads(row["write_scope"]),
        "trigger": trigger_dict(trigger),
        "workflow": workflow_dict(workflow, steps),
        "recent_executions": [execution_dict(database_path, item, include_automation=False) for item in recent],
    }


def trigger_dict(row: Any) -> dict[str, Any]:
    return dict(row) | {"configuration": json.loads(row["configuration"]), "enabled": bool(row["enabled"])}


def workflow_dict(row: Any, steps: list[Any]) -> dict[str, Any]:
    return dict(row) | {"steps": [step_dict(item) for item in steps]}


def step_dict(row: Any) -> dict[str, Any]:
    return dict(row) | {"configuration": json.loads(row["configuration"])}


def execution_dict(database_path: Path, row: Any, include_automation: bool = True) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        steps = connection.execute("SELECT * FROM automation_step_executions WHERE execution_id = ? ORDER BY position", (row["id"],)).fetchall()
        automation = connection.execute("SELECT id, name, status FROM automations WHERE id = ?", (row["automation_id"],)).fetchone() if include_automation else None
    return dict(row) | {
        "trigger_payload": json.loads(row["trigger_payload"]),
        "steps": [dict(item) | {"result": json.loads(item["result"])} for item in steps],
        "automation": dict(automation) if automation else None,
    }


def template_dict(row: Any) -> dict[str, Any]:
    return dict(row) | {"default_trigger": json.loads(row["default_trigger"]), "default_workflow_steps": json.loads(row["default_workflow_steps"])}


def record_skipped_execution(database_path: Path, context: AuthenticatedContext, automation: dict[str, Any], payload: dict[str, Any], reason: str) -> dict[str, Any]:
    execution_id = str(uuid.uuid4())
    key = stable_key(context.user["id"], automation["id"], str(payload.get("scheduled_for", iso_now())), reason)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT OR IGNORE INTO automation_executions(id, automation_id, user_id, trigger_type, trigger_payload, status, error_code, idempotency_key)
                VALUES (?, ?, ?, ?, ?, 'SKIPPED', ?, ?)
                """,
                (execution_id, automation["id"], context.user["id"], str(payload.get("trigger_type", "MANUAL")), json.dumps(payload), reason, key),
            )
            row = connection.execute("SELECT * FROM automation_executions WHERE user_id = ? AND idempotency_key = ?", (context.user["id"], key)).fetchone()
    return execution_dict(database_path, row)


def status_failed(database_path: Path, context: AuthenticatedContext, automation: dict[str, Any], execution_id: str, idempotency_key: str, exc: Exception) -> None:
    now = iso_now()
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "UPDATE automation_executions SET status = 'FAILED', completed_at = ?, error_code = ?, error_message = ?, updated_at = ? WHERE id = ?",
                (now, error_code(exc), str(exc), now, execution_id),
            )
            connection.execute("UPDATE scheduler_jobs SET status = 'FAILED', last_error = ?, updated_at = ? WHERE automation_id = ? AND idempotency_key = ?", (str(exc), now, automation["id"], idempotency_key))
    audit(database_path, "AUTOMATION_FAILED", context, "automation-failure", "AUTOMATION", automation["id"], {"error_code": error_code(exc)})
    activity(database_path, context, "AUTOMATION_FAILED", "AUTOMATION", automation["id"], f"{automation['name']} failed.")


def get_execution_by_key(database_path: Path, context: AuthenticatedContext, key: str) -> dict[str, Any] | None:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM automation_executions WHERE user_id = ? AND idempotency_key = ?", (context.user["id"], key)).fetchone()
    return execution_dict(database_path, row) if row else None


def insert_steps(connection: Any, workflow_id: str, steps: list[dict[str, Any]]) -> None:
    for index, raw in enumerate(steps, 1):
        step_type = validate_step_type(raw.get("step_type", raw.get("type", "NOTIFY")))
        connection.execute(
            "INSERT INTO workflow_steps(id, workflow_id, position, step_type, name, configuration, retry_limit, timeout_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), workflow_id, int(raw.get("position", index)), step_type, str(raw.get("name", step_type)).strip(), json.dumps(raw.get("configuration") or {}), int(raw.get("retry_limit", 0)), int(raw.get("timeout_seconds", 30))),
        )


def upsert_scheduler_job(connection: Any, automation_id: str, user_id: str, scheduled_for: str) -> None:
    key = stable_key(user_id, automation_id, scheduled_for, "TIME")
    connection.execute(
        """
        INSERT INTO scheduler_jobs(id, automation_id, user_id, scheduled_for, status, idempotency_key)
        VALUES (?, ?, ?, ?, 'SCHEDULED', ?)
        ON CONFLICT(user_id, idempotency_key) DO NOTHING
        """,
        (str(uuid.uuid4()), automation_id, user_id, scheduled_for, key),
    )


def compute_next_run(trigger_config: dict[str, Any], context: AuthenticatedContext, after_iso: str) -> str | None:
    trigger_type = validate_trigger_type(trigger_config.get("type", "MANUAL"))
    if trigger_type == "MANUAL":
        return None
    if trigger_type == "DATE":
        run_at = text_or_none(trigger_config.get("run_at"))
        if not run_at:
            return None
        return run_at if parse_iso(run_at) > parse_iso(after_iso) else None
    if trigger_type != "TIME":
        return None
    timezone = timezone_for(trigger_config.get("timezone") or context.user["timezone"])
    after = parse_iso(after_iso).astimezone(timezone)
    hour, minute = parse_time_of_day(str(trigger_config.get("time", "09:00")))
    schedule = str(trigger_config.get("schedule", "Daily")).lower()
    candidate = after.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if schedule == "hourly":
        candidate = after.replace(minute=minute, second=0, microsecond=0)
        if candidate <= after:
            candidate += timedelta(hours=1)
    elif schedule == "daily":
        if candidate <= after:
            candidate += timedelta(days=1)
    elif schedule == "weekly":
        day = int(trigger_config.get("day_of_week", 1))
        days_ahead = (day - candidate.isoweekday()) % 7
        candidate += timedelta(days=days_ahead)
        if candidate <= after:
            candidate += timedelta(days=7)
    elif schedule == "monthly":
        day = min(int(trigger_config.get("day_of_month", 1)), 28)
        candidate = candidate.replace(day=day)
        if candidate <= after:
            month = candidate.month + 1
            year = candidate.year + (1 if month > 12 else 0)
            month = 1 if month > 12 else month
            candidate = candidate.replace(year=year, month=month, day=day)
    elif schedule == "yearly":
        month = int(trigger_config.get("month", 1))
        day = min(int(trigger_config.get("day_of_month", 1)), 28)
        candidate = candidate.replace(month=month, day=day)
        if candidate <= after:
            candidate = candidate.replace(year=candidate.year + 1)
    elif schedule == "cron expression":
        candidate = after + timedelta(minutes=5)
    else:
        raise AuthError("VALIDATION_ERROR", "Unsupported schedule.", 400)
    return candidate.astimezone(UTC).replace(microsecond=0).isoformat()


def compute_initial_next_run(trigger_config: dict[str, Any], context: AuthenticatedContext, after_iso: str) -> str | None:
    if validate_trigger_type(trigger_config.get("type", "MANUAL")) == "DATE":
        return text_or_none(trigger_config.get("run_at"))
    return compute_next_run(trigger_config, context, after_iso)


def payload_from_template(database_path: Path, template_id: Any, context: AuthenticatedContext) -> dict[str, Any]:
    if not template_id:
        return {}
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM automation_templates WHERE id = ?", (str(template_id),)).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Automation template not found.", 404)
    template = template_dict(row)
    return {
        "name": template["name"],
        "description": template["description"],
        "automation_type": template["automation_type"],
        "authority_level": template["authority_level"],
        "trigger": template["default_trigger"] | {"timezone": context.user["timezone"]},
        "steps": template["default_workflow_steps"],
    }


def audit(database_path: Path, event_type: str, context: AuthenticatedContext, request_id: str, resource_type: str, resource_id: str, metadata: dict[str, Any] | None = None) -> None:
    record_audit_event(database_path, event_type, "USER", "SUCCEEDED", request_id, actor_id=context.user["id"], session_id=context.session["id"], resource_type=resource_type, resource_id=resource_id, metadata=metadata)


def activity(database_path: Path, context: AuthenticatedContext, event_type: str, resource_type: str, resource_id: str, summary: str) -> None:
    record_activity(database_path, context.user["id"], event_type, resource_type, resource_id, summary)


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


def validate_trigger_type(value: Any) -> str:
    trigger_type = str(value).strip().upper()
    if trigger_type not in TRIGGER_TYPES:
        raise AuthError("VALIDATION_ERROR", "Unsupported trigger type.", 400)
    return trigger_type


def validate_step_type(value: Any) -> str:
    step_type = str(value).strip().upper()
    if step_type not in STEP_TYPES:
        raise AuthError("VALIDATION_ERROR", "Unsupported workflow step type.", 400)
    return step_type


def validate_authority(value: Any) -> str:
    authority = str(value).strip().upper()
    if authority not in {"LOW", "MEDIUM", "HIGH"}:
        raise AuthError("VALIDATION_ERROR", "Invalid authority level.", 400)
    return authority


def parse_time_of_day(value: str) -> tuple[int, int]:
    parts = value.split(":", 1)
    hour = int(parts[0])
    minute = int(parts[1]) if len(parts) > 1 else 0
    if hour < 0 or hour > 23 or minute < 0 or minute > 59:
        raise AuthError("VALIDATION_ERROR", "Invalid time of day.", 400)
    return hour, minute


def timezone_for(value: str) -> ZoneInfo:
    try:
        return ZoneInfo(value)
    except ZoneInfoNotFoundError as exc:
        raise AuthError("VALIDATION_ERROR", "Invalid timezone.", 400) from exc


def error_code(exc: Exception) -> str:
    return exc.code if isinstance(exc, AuthError) else exc.__class__.__name__
