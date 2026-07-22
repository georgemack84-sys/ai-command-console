from __future__ import annotations

import json
import re
import time
import uuid
from contextlib import closing
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from day_to_day_assistant_api import calendar as cal
from day_to_day_assistant_api import memory as mem
from day_to_day_assistant_api import notes
from day_to_day_assistant_api import productivity as prod
from day_to_day_assistant_api.audit import record_audit_event
from day_to_day_assistant_api.auth import AuthError, AuthenticatedContext
from day_to_day_assistant_api.database import connect
from day_to_day_assistant_api.productivity import iso_now, record_activity


INTENTS = {
    "QUESTION",
    "SEARCH",
    "SUMMARY",
    "PLAN",
    "RECOMMEND",
    "TASK_REQUEST",
    "CALENDAR_REQUEST",
    "NOTE_REQUEST",
    "FOLLOWUP_REQUEST",
    "REMINDER_REQUEST",
    "NAVIGATION",
    "HELP",
    "UNKNOWN",
}

TOOL_DEFINITIONS = [
    ("today.summary", "Today Summary", "Read today's tasks, calendar events, reminders, and follow-ups.", {}, {"today": "object"}),
    ("task.search", "Task Search", "Search and list local tasks.", {"query": "object"}, {"tasks": "array"}),
    ("task.read", "Task Read", "Read a specific local task.", {"task_id": "string"}, {"task": "object"}),
    ("calendar.search", "Calendar Search", "Search and list local calendar events.", {"query": "object"}, {"events": "array"}),
    ("calendar.read", "Calendar Read", "Read a specific local calendar event.", {"event_id": "string"}, {"event": "object"}),
    ("reminder.search", "Reminder Search", "Search and list local reminders.", {"query": "object"}, {"reminders": "array"}),
    ("reminder.read", "Reminder Read", "Read a specific local reminder.", {"reminder_id": "string"}, {"reminder": "object"}),
    ("note.search", "Note Search", "Search local notes and attachment names.", {"query": "object"}, {"results": "array"}),
    ("note.read", "Note Read", "Read a specific local note.", {"note_id": "string"}, {"note": "object"}),
    ("followup.search", "Follow-Up Search", "Search and list local follow-ups.", {"query": "object"}, {"followups": "array"}),
    ("followup.read", "Follow-Up Read", "Read a specific local follow-up.", {"followup_id": "string"}, {"followup": "object"}),
]


def handle_request(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    started = time.perf_counter()
    raw_request = required_text(payload, "message")
    request_log_id = str(uuid.uuid4())
    try:
        intent = classify_intent(raw_request)
        entities = extract_entities(raw_request)
        create_request_log(database_path, context, request_log_id, raw_request, "UNDERSTOOD", intent, entities)
        tools = select_tools(intent, entities, raw_request)
        context_package = assemble_context(database_path, context, request_log_id, intent, entities, tools, raw_request)
        update_request_status(database_path, request_log_id, "CONTEXT_READY")
        plan = create_plan(database_path, context, request_log_id, intent, entities, tools, context_package)
        update_request_status(database_path, request_log_id, "PLANNED")
        answer = compose_response(raw_request, intent, entities, context_package, plan)
        update_request_status(database_path, request_log_id, "RESPONDED")
        elapsed = int((time.perf_counter() - started) * 1000)
        record_metrics(database_path, context, request_log_id, elapsed, context_package, tools, intent["confidence"], "SUCCEEDED")
        activity(database_path, context, "ASSISTANT_REQUEST_PLANNED", "REQUEST", request_log_id, f"Planned request: {intent['category']}", request_id)
        return {
            "request": get_request(database_path, context, request_log_id),
            "intent": intent,
            "entities": entities,
            "context_package": context_package,
            "plan": plan,
            "answer": answer,
        }
    except Exception as exc:
        elapsed = int((time.perf_counter() - started) * 1000)
        code = exc.code if isinstance(exc, AuthError) else exc.__class__.__name__
        create_request_log(database_path, context, request_log_id, raw_request, "FAILED", {"category": "UNKNOWN", "confidence": 0.0, "requires_context": False, "requires_planning": False, "requires_execution": False, "secondary_intents": []}, [], code)
        record_metrics(database_path, context, request_log_id, elapsed, {"retrieved_records": []}, [], 0.0, "FAILED", code)
        raise


def classify_intent(message: str) -> dict[str, Any]:
    text = message.lower()
    scores = {intent: 0 for intent in INTENTS}
    if any(word in text for word in ["what", "when", "which", "who", "how", "?"]):
        scores["QUESTION"] += 2
    if any(word in text for word in ["find", "search", "look up", "show me"]):
        scores["SEARCH"] += 3
    if any(word in text for word in ["summarize", "summary", "recap"]):
        scores["SUMMARY"] += 3
    if any(word in text for word in ["plan", "steps", "prepare", "organize"]):
        scores["PLAN"] += 3
    if any(word in text for word in ["recommend", "should i", "what should", "prioritize"]):
        scores["RECOMMEND"] += 5
    if any(word in text for word in ["task", "tasks", "todo", "overdue", "work on"]):
        scores["TASK_REQUEST"] += 4
    if any(word in text for word in ["calendar", "meeting", "event", "appointment", "today", "tomorrow", "week"]):
        scores["CALENDAR_REQUEST"] += 3
    if any(word in text for word in ["note", "notes", "notebook", "knowledge"]):
        scores["NOTE_REQUEST"] += 4
    if any(word in text for word in ["follow-up", "followup", "waiting"]):
        scores["FOLLOWUP_REQUEST"] += 4
    if any(word in text for word in ["reminder", "remind"]):
        scores["REMINDER_REQUEST"] += 4
    if any(word in text for word in ["go to", "open", "navigate"]):
        scores["NAVIGATION"] += 2
    if any(word in text for word in ["help", "what can you do"]):
        scores["HELP"] += 3
    ranked = sorted(scores.items(), key=lambda item: (-item[1], item[0]))
    primary, primary_score = ranked[0]
    if primary_score == 0:
        primary = "UNKNOWN"
    secondary = [intent for intent, score in ranked[1:] if score > 0][:3]
    requires_context = primary not in {"HELP", "UNKNOWN", "NAVIGATION"} or any(intent.endswith("_REQUEST") for intent in secondary)
    requires_planning = primary in {"PLAN", "RECOMMEND", "TASK_REQUEST", "CALENDAR_REQUEST", "NOTE_REQUEST", "FOLLOWUP_REQUEST", "REMINDER_REQUEST"} or len(secondary) > 1
    return {
        "id": str(uuid.uuid4()),
        "category": primary,
        "confidence": confidence(primary_score),
        "requires_context": requires_context,
        "requires_planning": requires_planning,
        "requires_execution": False,
        "secondary_intents": secondary,
    }


def extract_entities(message: str) -> list[dict[str, Any]]:
    text = message.lower()
    entities: list[dict[str, Any]] = []
    today = datetime.now(UTC).date()
    date_terms = {
        "today": today,
        "tomorrow": today + timedelta(days=1),
        "yesterday": today - timedelta(days=1),
    }
    for label, value in date_terms.items():
        if label in text:
            entities.append(entity("DATE", label, value.isoformat()))
    if "this week" in text or "week" in text:
        entities.append(entity("DATE", "this week", f"{today.isoformat()}/{(today + timedelta(days=7)).isoformat()}"))
    for priority in ["urgent", "high", "medium", "low"]:
        if priority in text:
            entities.append(entity("PRIORITY", priority, priority.upper()))
    for tag in re.findall(r"#([A-Za-z0-9_-]+)", message):
        entities.append(entity("TAG", f"#{tag}", tag.lower()))
    for quoted in re.findall(r'"([^"]+)"', message):
        entities.append(entity("NOTE", quoted, quoted))
    project_match = re.search(r"project\s+([A-Za-z0-9 _-]+)", message, flags=re.IGNORECASE)
    if project_match:
        value = project_match.group(0).strip()
        entities.append(entity("PROJECT", value, value))
    return entities


def assemble_context(database_path: Path, context: AuthenticatedContext, request_log_id: str, intent: dict[str, Any], entities: list[dict[str, Any]], tools: list[str], message: str) -> dict[str, Any]:
    records: list[dict[str, Any]] = []
    sources: list[str] = []
    query_term = context_query(message, entities)
    if "today.summary" in tools:
        snapshot = prod.today(database_path, context)
        records.extend(limit_records("TODAY", snapshot_items(snapshot), 12))
        sources.append("today")
    if "task.search" in tools:
        tasks = prod.list_tasks(database_path, context)
        records.extend(limit_records("TASK", filter_records(tasks, query_term, ["title", "description", "status", "priority"]), 8))
        sources.append("tasks")
    if "calendar.search" in tools:
        window = date_window(entities)
        events = cal.list_events(database_path, context, {"start": window[0], "end": window[1]})
        records.extend(limit_records("EVENT", filter_records(events, query_term, ["title", "description", "location", "status"]), 8))
        sources.append("calendar")
    if "reminder.search" in tools:
        reminders = prod.list_reminders(database_path, context)
        records.extend(limit_records("REMINDER", filter_records(reminders, query_term, ["title", "message", "status"]), 8))
        sources.append("reminders")
    if "note.search" in tools:
        note_results = notes.search(database_path, context, {"q": query_term}) if query_term else []
        records.extend(limit_records("NOTE", note_results, 8))
        sources.append("notes")
    if "followup.search" in tools:
        followups = prod.list_followups(database_path, context)
        records.extend(limit_records("FOLLOW_UP", filter_records(followups, query_term, ["title", "description", "status", "responsible_party"]), 8))
        sources.append("followups")
    memory_context = mem.retrieve_memories(database_path, context, {"query": message, "limit": 3}, request_log_id)
    if memory_context["memories"]:
        records.extend(limit_records("MEMORY", memory_context["memories"], 3))
        sources.append("memory")
    records = dedupe_records(records)[:32]
    package_id = str(uuid.uuid4())
    package = {
        "id": package_id,
        "request_id": request_log_id,
        "sources": sorted(set(sources)),
        "retrieved_records": records,
        "retrieval_reason": retrieval_reason(intent, tools, memory_context),
        "generated_at": iso_now(),
    }
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "INSERT INTO context_packages(id, request_id, user_id, sources, retrieved_records, retrieval_reason, generated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (package_id, request_log_id, context.user["id"], json.dumps(package["sources"]), json.dumps(records), package["retrieval_reason"], package["generated_at"]),
            )
    return package


def create_plan(database_path: Path, context: AuthenticatedContext, request_log_id: str, intent: dict[str, Any], entities: list[dict[str, Any]], tools: list[str], context_package: dict[str, Any]) -> dict[str, Any]:
    steps = [
        {"name": "Understand", "description": f"Classified primary intent as {intent['category']}."},
        {"name": "Retrieve", "description": f"Retrieved {len(context_package['retrieved_records'])} records from {', '.join(context_package['sources']) or 'no sources'}."},
        {"name": "Analyze", "description": "Rank records by relevance, recency, and explicit request terms."},
        {"name": "Select Tools", "description": f"Selected read-only tools: {', '.join(tools) or 'none'}."},
        {"name": "Create Plan", "description": "Prepare a non-destructive execution preview for the user."},
        {"name": "Explain", "description": "Explain assumptions, citations, and suggested next steps."},
    ]
    complexity = "HIGH" if len(tools) >= 4 else "MEDIUM" if len(tools) >= 2 else "LOW"
    plan_id = str(uuid.uuid4())
    explanation = explain(intent, tools, context_package)
    plan = {
        "id": plan_id,
        "request_id": request_log_id,
        "steps": steps,
        "required_tools": tools,
        "estimated_complexity": complexity,
        "requires_confirmation": False,
        "explanation": explanation,
        "status": "PLANNED",
        "created_at": iso_now(),
    }
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "INSERT INTO execution_plans(id, request_id, user_id, steps, required_tools, estimated_complexity, requires_confirmation, explanation, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PLANNED', ?)",
                (plan_id, request_log_id, context.user["id"], json.dumps(steps), json.dumps(tools), complexity, 0, explanation, plan["created_at"]),
            )
    return plan


def compose_response(message: str, intent: dict[str, Any], entities: list[dict[str, Any]], context_package: dict[str, Any], plan: dict[str, Any]) -> dict[str, Any]:
    records = context_package["retrieved_records"]
    answer = "I understood this as a request to "
    answer += intent["category"].lower().replace("_", " ")
    if records:
        answer += f" and found {len(records)} relevant local record(s)."
    else:
        answer += ". I did not find matching local records with the read-only tools selected."
    recommendations = recommendations_for(intent, records)
    return {
        "answer": answer,
        "supporting_evidence": records[:8],
        "recommendations": recommendations,
        "suggested_next_steps": ["Review the execution plan.", "Use Phase 8 action proposals when you are ready for approved changes."],
        "reasoning_summary": plan["explanation"],
        "citations": [{"record_type": item["record_type"], "record_id": item["record_id"], "title": item["title"]} for item in records[:8]],
        "read_only": True,
    }


def select_tools(intent: dict[str, Any], entities: list[dict[str, Any]], message: str) -> list[str]:
    category = intent["category"]
    secondary = set(intent.get("secondary_intents", []))
    text = message.lower()
    tools: list[str] = []
    if "today" in text or "what should" in text or category in {"RECOMMEND", "PLAN"}:
        tools.append("today.summary")
    if category == "TASK_REQUEST" or "TASK_REQUEST" in secondary or any(word in text for word in ["task", "overdue", "work on", "todo"]):
        tools.append("task.search")
    if category == "CALENDAR_REQUEST" or "CALENDAR_REQUEST" in secondary or any(word in text for word in ["calendar", "meeting", "event", "appointment", "today"]):
        tools.append("calendar.search")
    if category == "NOTE_REQUEST" or "NOTE_REQUEST" in secondary or any(word in text for word in ["note", "notes", "meeting notes", "knowledge"]):
        tools.append("note.search")
    if category == "FOLLOWUP_REQUEST" or "FOLLOWUP_REQUEST" in secondary or "follow" in text or "waiting" in text:
        tools.append("followup.search")
    if category == "REMINDER_REQUEST" or "REMINDER_REQUEST" in secondary or "reminder" in text:
        tools.append("reminder.search")
    if category in {"SEARCH", "SUMMARY"} and not tools:
        tools.extend(["note.search", "task.search"])
    return dedupe_strings(tools)


def seed_tool_registry(database_path: Path) -> None:
    with closing(connect(database_path)) as connection:
        with connection:
            for tool_id, name, description, input_schema, output_schema in TOOL_DEFINITIONS:
                connection.execute(
                    """
                    INSERT INTO tool_registry(id, name, description, input_schema, output_schema, read_only, is_enabled)
                    VALUES (?, ?, ?, ?, ?, 1, 1)
                    ON CONFLICT(name) DO UPDATE SET
                      description = excluded.description,
                      input_schema = excluded.input_schema,
                      output_schema = excluded.output_schema,
                      read_only = 1,
                      is_enabled = 1,
                      updated_at = CURRENT_TIMESTAMP
                    """,
                    (tool_id, name, description, json.dumps(input_schema), json.dumps(output_schema)),
                )


def list_tools(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    seed_tool_registry(database_path)
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM tool_registry WHERE is_enabled = 1 ORDER BY name").fetchall()
    return [tool_dict(row) for row in rows]


def get_plan(database_path: Path, context: AuthenticatedContext, plan_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM execution_plans WHERE id = ? AND user_id = ?", (plan_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Plan not found.", 404)
    return plan_dict(row)


def get_context_package(database_path: Path, context: AuthenticatedContext, package_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM context_packages WHERE id = ? AND user_id = ?", (package_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Context package not found.", 404)
    return context_dict(row)


def list_planning_metrics(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM planning_metrics WHERE user_id = ? ORDER BY created_at DESC LIMIT 100", (context.user["id"],)).fetchall()
    return [metrics_dict(row) for row in rows]


def get_request(database_path: Path, context: AuthenticatedContext, request_log_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM request_log WHERE id = ? AND user_id = ?", (request_log_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Request not found.", 404)
    return request_dict(row)


def create_request_log(database_path: Path, context: AuthenticatedContext, request_log_id: str, raw_request: str, status: str, intent: dict[str, Any], entities: list[dict[str, Any]], error_code: str | None = None) -> None:
    with closing(connect(database_path)) as connection:
        existing = connection.execute("SELECT id FROM request_log WHERE id = ?", (request_log_id,)).fetchone()
        with connection:
            if existing:
                connection.execute(
                    "UPDATE request_log SET status = ?, primary_intent = ?, secondary_intents = ?, entities = ?, error_code = ?, updated_at = ? WHERE id = ?",
                    (status, intent["category"], json.dumps(intent.get("secondary_intents", [])), json.dumps(entities), error_code, iso_now(), request_log_id),
                )
            else:
                connection.execute(
                    "INSERT INTO request_log(id, user_id, raw_request, status, primary_intent, secondary_intents, entities, error_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (request_log_id, context.user["id"], raw_request, status, intent["category"], json.dumps(intent.get("secondary_intents", [])), json.dumps(entities), error_code),
                )


def update_request_status(database_path: Path, request_log_id: str, status: str) -> None:
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute("UPDATE request_log SET status = ?, updated_at = ? WHERE id = ?", (status, iso_now(), request_log_id))


def record_metrics(database_path: Path, context: AuthenticatedContext, request_log_id: str, planning_time_ms: int, context_package: dict[str, Any], tools: list[str], confidence_score: float, status: str, error_code: str | None = None) -> None:
    records = context_package.get("retrieved_records", [])
    size = len(json.dumps(records))
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "INSERT INTO planning_metrics(id, request_id, user_id, planning_time_ms, context_record_count, context_size_chars, selected_tools, confidence, status, error_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (str(uuid.uuid4()), request_log_id, context.user["id"], planning_time_ms, len(records), size, json.dumps(tools), confidence_score, status, error_code),
            )


def snapshot_items(snapshot: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for key, value in snapshot.items():
        if isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    rows.append(dict(item) | {"today_bucket": key})
    return rows


def filter_records(records: list[dict[str, Any]], term: str, fields: list[str]) -> list[dict[str, Any]]:
    if not term:
        return records
    lowered = term.lower()
    filtered = [record for record in records if any(lowered in str(record.get(field, "")).lower() for field in fields)]
    return filtered or records[:5]


def limit_records(record_type: str, records: list[dict[str, Any]], limit: int) -> list[dict[str, Any]]:
    limited = []
    for record in records[:limit]:
        record_id = str(record.get("id") or record.get("record_id") or f"{record_type.lower()}-{len(limited)}")
        title = str(record.get("title") or record.get("name") or record.get("record_type") or record_type)
        limited.append({"record_type": record_type, "record_id": record_id, "title": title, "summary": summarize_record(record), "citation": f"{record_type}:{record_id}"})
    return limited


def summarize_record(record: dict[str, Any]) -> str:
    parts = []
    for key in ["status", "priority", "due_classification", "timing_classification", "start_at", "scheduled_at", "description", "highlighted_excerpt"]:
        if record.get(key):
            parts.append(f"{key}={record[key]}")
    return "; ".join(parts)[:500]


def dedupe_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen = set()
    result = []
    for record in records:
        key = (record["record_type"], record["record_id"])
        if key in seen:
            continue
        seen.add(key)
        result.append(record)
    return result


def date_window(entities: list[dict[str, Any]]) -> tuple[str, str]:
    today = datetime.now(UTC).date()
    for item in entities:
        if item["type"] == "DATE" and "/" in item["normalized_value"]:
            start, end = item["normalized_value"].split("/", 1)
            return f"{start}T00:00:00+00:00", f"{end}T00:00:00+00:00"
        if item["type"] == "DATE":
            start = item["normalized_value"]
            return f"{start}T00:00:00+00:00", f"{start}T23:59:59+00:00"
    return f"{today.isoformat()}T00:00:00+00:00", f"{(today + timedelta(days=7)).isoformat()}T00:00:00+00:00"


def context_query(message: str, entities: list[dict[str, Any]]) -> str:
    for kind in ["NOTE", "PROJECT", "TASK", "EVENT", "TAG"]:
        for item in entities:
            if item["type"] == kind:
                return str(item["normalized_value"])
    stop = {"what", "should", "today", "tomorrow", "find", "show", "me", "my", "the", "a", "an", "to", "on", "for", "do", "i", "have"}
    terms = [word for word in re.findall(r"[A-Za-z0-9_-]+", message) if word.lower() not in stop]
    return " ".join(terms[:4])


def retrieval_reason(intent: dict[str, Any], tools: list[str], memory_context: dict[str, Any] | None = None) -> str:
    if not tools:
        reason = "No domain tool context was required for this request."
    else:
        reason = f"Selected read-only tools because the primary intent was {intent['category']} and the request required grounded local context."
    if memory_context and memory_context.get("memory_ids"):
        reason += f" Retrieved {len(memory_context['memory_ids'])} relevant approved memories."
    return reason


def explain(intent: dict[str, Any], tools: list[str], context_package: dict[str, Any]) -> str:
    return (
        f"The planner classified the request as {intent['category']} with confidence {intent['confidence']:.2f}. "
        f"It selected {len(tools)} read-only tool(s) and retrieved {len(context_package['retrieved_records'])} cited record(s). "
        "State-changing actions still require Phase 8 proposals and explicit confirmation."
    )


def recommendations_for(intent: dict[str, Any], records: list[dict[str, Any]]) -> list[str]:
    if intent["category"] == "RECOMMEND":
        return ["Start with overdue or high-priority items that do not conflict with calendar events.", "Use the cited records to confirm priorities before taking action."]
    if intent["category"] == "SEARCH":
        return ["Open the cited records that match your search terms."]
    if not records:
        return ["Ask a narrower question or add more local records for the planner to retrieve."]
    return ["Review the supporting evidence before deciding on any follow-up action."]


def entity(entity_type: str, raw: str, normalized: str) -> dict[str, Any]:
    return {"type": entity_type, "raw_value": raw, "normalized_value": normalized, "confidence": 0.8}


def confidence(score: int) -> float:
    if score <= 0:
        return 0.2
    return min(0.95, 0.45 + score * 0.1)


def dedupe_strings(values: list[str]) -> list[str]:
    result = []
    for value in values:
        if value not in result:
            result.append(value)
    return result


def request_dict(row: Any) -> dict[str, Any]:
    item = dict(row)
    item["secondary_intents"] = json.loads(item["secondary_intents"])
    item["entities"] = json.loads(item["entities"])
    return item


def context_dict(row: Any) -> dict[str, Any]:
    item = dict(row)
    item["sources"] = json.loads(item["sources"])
    item["retrieved_records"] = json.loads(item["retrieved_records"])
    return item


def plan_dict(row: Any) -> dict[str, Any]:
    item = dict(row)
    item["steps"] = json.loads(item["steps"])
    item["required_tools"] = json.loads(item["required_tools"])
    item["requires_confirmation"] = bool(item["requires_confirmation"])
    return item


def metrics_dict(row: Any) -> dict[str, Any]:
    item = dict(row)
    item["selected_tools"] = json.loads(item["selected_tools"])
    return item


def tool_dict(row: Any) -> dict[str, Any]:
    item = dict(row)
    item["input_schema"] = json.loads(item["input_schema"])
    item["output_schema"] = json.loads(item["output_schema"])
    item["read_only"] = bool(item["read_only"])
    item["is_enabled"] = bool(item["is_enabled"])
    return item


def required_text(payload: dict[str, Any], key: str) -> str:
    value = str(payload.get(key, "")).strip()
    if not value:
        raise AuthError("VALIDATION_ERROR", f"{key} is required.", 400)
    return value


def activity(database_path: Path, context: AuthenticatedContext, event_type: str, resource_type: str, resource_id: str, summary: str, request_id: str) -> None:
    record_activity(database_path, context.user["id"], event_type, resource_type, resource_id, summary)
    record_audit_event(database_path, event_type, "USER", "SUCCEEDED", request_id, actor_id=context.user["id"], session_id=context.session["id"], resource_type=resource_type, resource_id=resource_id)
