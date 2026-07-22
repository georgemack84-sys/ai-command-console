from __future__ import annotations

import json
import re
import uuid
from contextlib import closing
from pathlib import Path
from typing import Any

from day_to_day_assistant_api.audit import record_audit_event
from day_to_day_assistant_api.auth import AuthError, AuthenticatedContext, iso_now, parse_iso, utc_now
from day_to_day_assistant_api.database import connect
from day_to_day_assistant_api.productivity import record_activity


CATEGORIES = {"Preference", "Routine", "Commitment", "Reference", "Interaction", "Outcome", "Correction"}
SENSITIVITY = {"GENERAL", "PERSONAL", "SENSITIVE"}
SOURCES = {"USER_REQUEST", "APPROVED_ROUTINE", "EXPLICIT_PREFERENCE", "SUCCESSFUL_WORKFLOW", "SYSTEM_RULE"}


def create_memory(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    privacy = get_privacy_settings(database_path, context)
    if not privacy["memory_enabled"]:
        raise AuthError("MEMORY_DISABLED", "Memory is disabled.", 403)
    category = validate_category(payload.get("category", "Reference"))
    if category in privacy["disabled_categories"]:
        raise AuthError("MEMORY_CATEGORY_DISABLED", "This memory category is disabled.", 403)
    sensitivity = validate_sensitivity(payload.get("sensitivity", "GENERAL"))
    if sensitivity == "SENSITIVE" and str(payload.get("confirmation_text", "")).strip().upper() != "REMEMBER":
        raise AuthError("STRONG_CONFIRMATION_REQUIRED", "Type REMEMBER to store sensitive memory.", 400)
    memory_id = str(uuid.uuid4())
    confidence = clamp_float(payload.get("confidence", 1.0), 0, 1)
    now = iso_now()
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO memories(
                  id, user_id, category, title, content, confidence, sensitivity, source_type,
                  source_id, status, valid_from, valid_until
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
                """,
                (
                    memory_id,
                    context.user["id"],
                    category,
                    required_text(payload, "title"),
                    required_text(payload, "content"),
                    confidence,
                    sensitivity,
                    validate_source(payload.get("source_type", "USER_REQUEST")),
                    text_or_none(payload.get("source_id")),
                    str(payload.get("valid_from") or now),
                    text_or_none(payload.get("valid_until")),
                ),
            )
            insert_version(connection, memory_id, 1, payload, category, confidence, sensitivity, "created")
    audit(database_path, "MEMORY_CREATED", context, request_id, "MEMORY", memory_id, {"category": category})
    activity(database_path, context, "MEMORY_CREATED", "MEMORY", memory_id, f"Remembered {payload['title']}")
    return get_memory(database_path, context, memory_id)


def create_memory_proposal(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    proposal_id = str(uuid.uuid4())
    category = validate_category(payload.get("category", "Reference"))
    sensitivity = validate_sensitivity(payload.get("sensitivity", "GENERAL"))
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO memory_proposals(id, user_id, category, title, content, reason, confidence, sensitivity, valid_until, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROPOSED')
                """,
                (
                    proposal_id,
                    context.user["id"],
                    category,
                    required_text(payload, "title"),
                    required_text(payload, "content"),
                    required_text(payload, "reason"),
                    clamp_float(payload.get("confidence", 0.8), 0, 1),
                    sensitivity,
                    text_or_none(payload.get("valid_until")),
                ),
            )
    audit(database_path, "MEMORY_PROPOSED", context, request_id, "MEMORY_PROPOSAL", proposal_id, {"category": category})
    return get_memory_proposal(database_path, context, proposal_id)


def decide_memory_proposal(database_path: Path, context: AuthenticatedContext, proposal_id: str, decision: str, request_id: str) -> dict[str, Any]:
    proposal = get_memory_proposal(database_path, context, proposal_id)
    if proposal["status"] != "PROPOSED":
        raise AuthError("PROPOSAL_CLOSED", "Memory proposal is already decided.", 409)
    decision = decision.upper()
    if decision == "REMEMBER":
        memory = create_memory(
            database_path,
            context,
            {
                "category": proposal["category"],
                "title": proposal["title"],
                "content": proposal["content"],
                "confidence": proposal["confidence"],
                "sensitivity": proposal["sensitivity"],
                "source_type": "USER_REQUEST",
                "source_id": proposal_id,
                "valid_until": proposal["valid_until"],
                "confirmation_text": "REMEMBER",
            },
            request_id,
        )
        status = "REMEMBERED"
        memory_id = memory["id"]
    elif decision == "TEMPORARY":
        memory = create_memory(
            database_path,
            context,
            {
                "category": proposal["category"],
                "title": proposal["title"],
                "content": proposal["content"],
                "confidence": proposal["confidence"],
                "sensitivity": proposal["sensitivity"],
                "source_type": "USER_REQUEST",
                "source_id": proposal_id,
                "valid_until": proposal["valid_until"] or iso_now(),
                "confirmation_text": "REMEMBER",
            },
            request_id,
        )
        status = "TEMPORARY"
        memory_id = memory["id"]
    elif decision == "REJECT":
        status = "REJECTED"
        memory_id = None
    else:
        raise AuthError("VALIDATION_ERROR", "Unsupported memory decision.", 400)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "UPDATE memory_proposals SET status = ?, created_memory_id = ?, decided_at = ? WHERE id = ?",
                (status, memory_id, iso_now(), proposal_id),
            )
    return get_memory_proposal(database_path, context, proposal_id)


def list_memory_proposals(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            "SELECT * FROM memory_proposals WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
            (context.user["id"],),
        ).fetchall()
    return [dict(row) for row in rows]


def get_memory_proposal(database_path: Path, context: AuthenticatedContext, proposal_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM memory_proposals WHERE id = ? AND user_id = ?", (proposal_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Memory proposal not found.", 404)
    return dict(row)


def list_memories(database_path: Path, context: AuthenticatedContext, query: dict[str, str] | None = None) -> list[dict[str, Any]]:
    expire_memories(database_path, context)
    query = query or {}
    include_archived = query.get("include_archived") == "true"
    include_deleted = query.get("include_deleted") == "true"
    sql = "SELECT * FROM memories WHERE user_id = ?"
    args: list[Any] = [context.user["id"]]
    if not include_archived:
        sql += " AND status != 'ARCHIVED'"
    if not include_deleted:
        sql += " AND status != 'DELETED'"
    if query.get("category"):
        sql += " AND category = ?"
        args.append(query["category"])
    if query.get("q"):
        term = f"%{query['q'].lower()}%"
        sql += " AND (lower(title) LIKE ? OR lower(content) LIKE ?)"
        args.extend([term, term])
    sql += " ORDER BY status = 'ACTIVE' DESC, last_used_at DESC, updated_at DESC LIMIT 200"
    with closing(connect(database_path)) as connection:
        rows = connection.execute(sql, args).fetchall()
    return [memory_dict(database_path, row) for row in rows]


def get_memory(database_path: Path, context: AuthenticatedContext, memory_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM memories WHERE id = ? AND user_id = ?", (memory_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Memory not found.", 404)
    return memory_dict(database_path, row)


def update_memory(database_path: Path, context: AuthenticatedContext, memory_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    current = get_memory(database_path, context, memory_id)
    if current["status"] == "DELETED":
        raise AuthError("MEMORY_DELETED", "Deleted memories cannot be edited.", 409)
    category = validate_category(payload.get("category", current["category"]))
    sensitivity = validate_sensitivity(payload.get("sensitivity", current["sensitivity"]))
    confidence = clamp_float(payload.get("confidence", current["confidence"]), 0, 1)
    with closing(connect(database_path)) as connection:
        with connection:
            version = int(current["version"]) + 1
            connection.execute(
                """
                UPDATE memories
                SET category = ?, title = ?, content = ?, confidence = ?, sensitivity = ?,
                    valid_until = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (
                    category,
                    str(payload.get("title", current["title"])).strip(),
                    str(payload.get("content", current["content"])).strip(),
                    confidence,
                    sensitivity,
                    text_or_none(payload.get("valid_until", current["valid_until"])),
                    iso_now(),
                    memory_id,
                    context.user["id"],
                ),
            )
            insert_version(connection, memory_id, version, payload | {"title": payload.get("title", current["title"]), "content": payload.get("content", current["content"])}, category, confidence, sensitivity, text_or_none(payload.get("change_reason")) or "updated")
    audit(database_path, "MEMORY_UPDATED", context, request_id, "MEMORY", memory_id)
    activity(database_path, context, "MEMORY_UPDATED", "MEMORY", memory_id, f"Updated memory {current['title']}")
    return get_memory(database_path, context, memory_id)


def memory_action(database_path: Path, context: AuthenticatedContext, memory_id: str, action: str, request_id: str) -> dict[str, Any]:
    current = get_memory(database_path, context, memory_id)
    mapping = {"archive": "ARCHIVED", "restore": "ACTIVE", "delete": "DELETED"}
    status = mapping.get(action)
    if not status:
        raise AuthError("VALIDATION_ERROR", "Unsupported memory action.", 400)
    now = iso_now()
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "UPDATE memories SET status = ?, archived_at = ?, deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
                (
                    status,
                    now if status == "ARCHIVED" else None if current["status"] == "ARCHIVED" else current["archived_at"],
                    now if status == "DELETED" else current["deleted_at"],
                    now,
                    memory_id,
                    context.user["id"],
                ),
            )
    event = {"archive": "MEMORY_ARCHIVED", "restore": "MEMORY_UPDATED", "delete": "MEMORY_DELETED"}[action]
    audit(database_path, event, context, request_id, "MEMORY", memory_id)
    activity(database_path, context, event, "MEMORY", memory_id, f"{action.title()} memory {current['title']}")
    return get_memory(database_path, context, memory_id)


def delete_memory(database_path: Path, context: AuthenticatedContext, memory_id: str, request_id: str) -> dict[str, Any]:
    return memory_action(database_path, context, memory_id, "delete", request_id)


def retrieve_memories(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    expire_memories(database_path, context)
    privacy = get_privacy_settings(database_path, context)
    if not privacy["memory_enabled"]:
        return {"memory_ids": [], "memories": [], "retrieval_reason": "Memory disabled.", "relevance": {}}
    query = str(payload.get("query") or payload.get("message") or "").strip()
    categories = set(payload.get("categories") or CATEGORIES) - set(privacy["disabled_categories"])
    terms = tokenize(query)
    candidates = [item for item in list_memories(database_path, context, {"include_archived": "false"}) if item["status"] == "ACTIVE" and item["category"] in categories]
    scored: list[dict[str, Any]] = []
    for memory in candidates:
        score = relevance_score(memory, terms)
        if score > 0:
            scored.append(memory | {"retrieval_score": score})
    scored.sort(key=lambda item: (item["retrieval_score"], item["confidence"], item["updated_at"]), reverse=True)
    limit = int(payload.get("limit", 5))
    selected = scored[:limit]
    now = iso_now()
    with closing(connect(database_path)) as connection:
        with connection:
            for memory in selected:
                connection.execute("UPDATE memories SET last_used_at = ?, retrieval_score = ? WHERE id = ?", (now, memory["retrieval_score"], memory["id"]))
            retrieval_id = str(uuid.uuid4())
            relevance = {memory["id"]: memory["retrieval_score"] for memory in selected}
            connection.execute(
                "INSERT INTO memory_retrievals(id, user_id, query, memory_ids, retrieval_reason, relevance) VALUES (?, ?, ?, ?, ?, ?)",
                (retrieval_id, context.user["id"], query, json.dumps([memory["id"] for memory in selected]), "Matched query terms, recency, confidence, and category filters.", json.dumps(relevance)),
            )
    if selected:
        audit(database_path, "MEMORY_RETRIEVED", context, request_id, "MEMORY_RETRIEVAL", retrieval_id, {"memory_ids": [memory["id"] for memory in selected]})
    return {"memory_ids": [memory["id"] for memory in selected], "memories": selected, "retrieval_reason": "Matched query terms, recency, confidence, and category filters.", "relevance": {memory["id"]: memory["retrieval_score"] for memory in selected}}


def get_preferences(database_path: Path, context: AuthenticatedContext) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM preferences WHERE user_id = ? AND is_enabled = 1 ORDER BY key, source", (context.user["id"],)).fetchall()
    explicit: dict[str, Any] = {}
    learned: dict[str, Any] = {}
    effective: dict[str, Any] = {}
    for row in rows:
        target = explicit if row["source"] == "EXPLICIT" else learned
        target[row["key"]] = preference_dict(row)
    effective.update({key: item["value"] for key, item in learned.items()})
    effective.update({key: item["value"] for key, item in explicit.items()})
    settings_overrides = {"timezone": context.user["timezone"], "locale": context.user["locale"]}
    effective.update(settings_overrides)
    return {"explicit": explicit, "learned": learned, "effective": effective, "settings_overrides": settings_overrides}


def upsert_preference(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    key = required_text(payload, "key")
    source = str(payload.get("source", "EXPLICIT")).upper()
    if source not in {"EXPLICIT", "LEARNED"}:
        raise AuthError("VALIDATION_ERROR", "Preference source must be EXPLICIT or LEARNED.", 400)
    preference_id = str(uuid.uuid4())
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO preferences(id, user_id, key, value, category, source, confidence, is_enabled)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT(user_id, key, source) DO UPDATE SET
                  value = excluded.value,
                  category = excluded.category,
                  confidence = excluded.confidence,
                  is_enabled = 1,
                  updated_at = CURRENT_TIMESTAMP
                """,
                (
                    preference_id,
                    context.user["id"],
                    key,
                    required_text(payload, "value"),
                    str(payload.get("category", "General")),
                    source,
                    clamp_float(payload.get("confidence", 1.0), 0, 1),
                ),
            )
    audit(database_path, "MEMORY_UPDATED", context, request_id, "PREFERENCE", key, {"source": source})
    return get_preferences(database_path, context)


def personalize(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    preferences = get_preferences(database_path, context)
    retrieval = retrieve_memories(database_path, context, payload, request_id)
    effective = preferences["effective"]
    adjustments = []
    for key in ["writing_style", "planning_style", "preferred_units", "working_hours", "preferred_day_start"]:
        if key in effective:
            adjustments.append({"key": key, "value": effective[key], "reason": "Explicit preferences override learned behavior."})
    return {
        "personalization": {
            "adjustments": adjustments,
            "memory_context": retrieval,
            "explanation": "Personalization changes tone, length, or planning style only; it does not change facts or override the current request.",
        },
        "preferences": preferences,
    }


def create_outcome(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    outcome_id = str(uuid.uuid4())
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO outcomes(id, user_id, recommendation, accepted, completed, satisfaction, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    outcome_id,
                    context.user["id"],
                    required_text(payload, "recommendation"),
                    1 if bool(payload.get("accepted", False)) else 0,
                    1 if bool(payload.get("completed", False)) else 0,
                    int(payload.get("satisfaction", 0)),
                    text_or_none(payload.get("notes")),
                ),
            )
    audit(database_path, "MEMORY_UPDATED", context, request_id, "OUTCOME", outcome_id)
    return get_outcome(database_path, context, outcome_id)


def list_outcomes(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM outcomes WHERE user_id = ? ORDER BY created_at DESC LIMIT 100", (context.user["id"],)).fetchall()
    return [bool_row(row, ["accepted", "completed"]) for row in rows]


def get_outcome(database_path: Path, context: AuthenticatedContext, outcome_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM outcomes WHERE id = ? AND user_id = ?", (outcome_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Outcome not found.", 404)
    return bool_row(row, ["accepted", "completed"])


def create_routine(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    routine_id = str(uuid.uuid4())
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "INSERT INTO routine_templates(id, user_id, name, description, cadence, status, source_memory_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (routine_id, context.user["id"], required_text(payload, "name"), text_or_none(payload.get("description")), required_text(payload, "cadence"), str(payload.get("status", "PROPOSED")), text_or_none(payload.get("source_memory_id"))),
            )
    audit(database_path, "MEMORY_UPDATED", context, request_id, "ROUTINE", routine_id)
    return get_routine(database_path, context, routine_id)


def list_routines(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM routine_templates WHERE user_id = ? ORDER BY status, name", (context.user["id"],)).fetchall()
    return [dict(row) for row in rows]


def get_routine(database_path: Path, context: AuthenticatedContext, routine_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM routine_templates WHERE id = ? AND user_id = ?", (routine_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Routine not found.", 404)
    return dict(row)


def get_privacy_settings(database_path: Path, context: AuthenticatedContext) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute("INSERT OR IGNORE INTO memory_privacy_settings(user_id) VALUES (?)", (context.user["id"],))
            row = connection.execute("SELECT * FROM memory_privacy_settings WHERE user_id = ?", (context.user["id"],)).fetchone()
    return dict(row) | {"memory_enabled": bool(row["memory_enabled"]), "personalization_enabled": bool(row["personalization_enabled"]), "disabled_categories": json.loads(row["disabled_categories"])}


def update_privacy_settings(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    disabled = [validate_category(item) for item in payload.get("disabled_categories", [])]
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO memory_privacy_settings(user_id, memory_enabled, disabled_categories, personalization_enabled, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                  memory_enabled = excluded.memory_enabled,
                  disabled_categories = excluded.disabled_categories,
                  personalization_enabled = excluded.personalization_enabled,
                  updated_at = excluded.updated_at
                """,
                (
                    context.user["id"],
                    1 if bool(payload.get("memory_enabled", True)) else 0,
                    json.dumps(disabled),
                    1 if bool(payload.get("personalization_enabled", True)) else 0,
                    iso_now(),
                ),
            )
    audit(database_path, "MEMORY_UPDATED", context, request_id, "MEMORY_PRIVACY", context.user["id"])
    return get_privacy_settings(database_path, context)


def export_memory(database_path: Path, context: AuthenticatedContext) -> dict[str, Any]:
    return {
        "memories": list_memories(database_path, context, {"include_archived": "true", "include_deleted": "true"}),
        "preferences": get_preferences(database_path, context),
        "outcomes": list_outcomes(database_path, context),
        "routines": list_routines(database_path, context),
        "privacy": get_privacy_settings(database_path, context),
    }


def clear_memory(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    category = payload.get("category")
    with closing(connect(database_path)) as connection:
        with connection:
            if category:
                validated = validate_category(category)
                cursor = connection.execute("UPDATE memories SET status = 'DELETED', deleted_at = ?, updated_at = ? WHERE user_id = ? AND category = ?", (iso_now(), iso_now(), context.user["id"], validated))
            else:
                cursor = connection.execute("UPDATE memories SET status = 'DELETED', deleted_at = ?, updated_at = ? WHERE user_id = ?", (iso_now(), iso_now(), context.user["id"]))
    audit(database_path, "MEMORY_DELETED", context, request_id, "MEMORY", "bulk", {"category": category, "count": cursor.rowcount})
    return {"deleted_count": int(cursor.rowcount)}


def expire_memories(database_path: Path, context: AuthenticatedContext) -> None:
    now = iso_now()
    expired: list[dict[str, Any]] = []
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            "SELECT id, title FROM memories WHERE user_id = ? AND status = 'ACTIVE' AND valid_until IS NOT NULL AND valid_until <= ?",
            (context.user["id"], now),
        ).fetchall()
        with connection:
            for row in rows:
                connection.execute("UPDATE memories SET status = 'EXPIRED', updated_at = ? WHERE id = ?", (now, row["id"]))
                expired.append(dict(row))
    for item in expired:
        record_activity(database_path, context.user["id"], "MEMORY_EXPIRED", "MEMORY", item["id"], f"Expired memory {item['title']}")


def memory_dict(database_path: Path, row: Any) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        versions = connection.execute("SELECT * FROM memory_versions WHERE memory_id = ? ORDER BY version_number DESC", (row["id"],)).fetchall()
    return dict(row) | {"version": versions[0]["version_number"] if versions else 1, "versions": [dict(item) for item in versions]}


def insert_version(connection: Any, memory_id: str, version: int, payload: dict[str, Any], category: str, confidence: float, sensitivity: str, reason: str) -> None:
    connection.execute(
        """
        INSERT INTO memory_versions(id, memory_id, version_number, title, content, category, confidence, sensitivity, change_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (str(uuid.uuid4()), memory_id, version, required_text(payload, "title"), required_text(payload, "content"), category, confidence, sensitivity, reason),
    )


def audit(database_path: Path, event_type: str, context: AuthenticatedContext, request_id: str, resource_type: str, resource_id: str, metadata: dict[str, Any] | None = None) -> None:
    record_audit_event(database_path, event_type, "USER", "SUCCEEDED", request_id, actor_id=context.user["id"], session_id=context.session["id"], resource_type=resource_type, resource_id=resource_id, metadata=metadata)


def activity(database_path: Path, context: AuthenticatedContext, event_type: str, resource_type: str, resource_id: str, summary: str) -> None:
    record_activity(database_path, context.user["id"], event_type, resource_type, resource_id, summary)


def preference_dict(row: Any) -> dict[str, Any]:
    return bool_row(row, ["is_enabled"])


def bool_row(row: Any, keys: list[str]) -> dict[str, Any]:
    data = dict(row)
    for key in keys:
        data[key] = bool(data[key])
    return data


def validate_category(value: Any) -> str:
    category = str(value).strip()
    if category not in CATEGORIES:
        raise AuthError("VALIDATION_ERROR", "Invalid memory category.", 400)
    return category


def validate_sensitivity(value: Any) -> str:
    sensitivity = str(value).strip().upper()
    if sensitivity not in SENSITIVITY:
        raise AuthError("VALIDATION_ERROR", "Invalid memory sensitivity.", 400)
    return sensitivity


def validate_source(value: Any) -> str:
    source = str(value).strip().upper()
    if source not in SOURCES:
        raise AuthError("VALIDATION_ERROR", "Invalid memory source.", 400)
    return source


def required_text(payload: dict[str, Any], key: str) -> str:
    value = str(payload.get(key, "")).strip()
    if not value:
        raise AuthError("VALIDATION_ERROR", f"{key} is required.", 400)
    return value


def text_or_none(value: Any) -> str | None:
    text = str(value).strip() if value is not None else ""
    return text or None


def clamp_float(value: Any, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, float(value)))


def tokenize(value: str) -> set[str]:
    return {item for item in re.split(r"[^a-z0-9]+", value.lower()) if len(item) > 2}


def relevance_score(memory: dict[str, Any], terms: set[str]) -> float:
    haystack = tokenize(f"{memory['title']} {memory['content']} {memory['category']}")
    overlap = len(terms & haystack)
    if not overlap and terms:
        return 0
    confidence = float(memory["confidence"])
    recency = 0.1 if memory.get("last_used_at") else 0
    return round(overlap + confidence + recency, 3)
