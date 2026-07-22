from __future__ import annotations

import json
import time
import uuid
from contextlib import closing
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from day_to_day_assistant_api.audit import record_audit_event
from day_to_day_assistant_api.auth import AuthError, AuthenticatedContext
from day_to_day_assistant_api.database import connect
from day_to_day_assistant_api.productivity import iso_now, record_activity, text_or_none


ROLES = {"SYSTEM", "USER", "ASSISTANT", "TOOL"}
PROVIDERS = {"mock", "hosted", "local"}
DEFAULT_PROMPT_NAME = "conversation.advisory"
DEFAULT_PROMPT_VERSION = "2026-07-18.d2d6"
MAX_MESSAGE_CHARS = 12000


@dataclass(frozen=True)
class GatewayResponse:
    text: str
    provider: str
    model: str
    prompt_version: str
    request_tokens: int
    response_tokens: int
    latency_ms: int
    estimated_cost: float
    structured_payload: dict[str, Any]
    chunks: list[str]


def create_conversation(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    conversation_id = str(uuid.uuid4())
    title = str(payload.get("title") or "New conversation").strip()[:160] or "New conversation"
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "INSERT INTO conversations(id, user_id, title, status) VALUES (?, ?, ?, 'ACTIVE')",
                (conversation_id, context.user["id"], title),
            )
    activity(database_path, context, "CONVERSATION_CREATED", "CONVERSATION", conversation_id, f"Created conversation {title}", request_id)
    return get_conversation(database_path, context, conversation_id)


def list_conversations(database_path: Path, context: AuthenticatedContext, query: dict[str, str] | None = None) -> list[dict[str, Any]]:
    query = query or {}
    sql = """
    SELECT c.*, COUNT(m.id) AS message_count
    FROM conversations c
    LEFT JOIN messages m ON m.conversation_id = c.id
    WHERE c.user_id = ?
    """
    args: list[Any] = [context.user["id"]]
    if query.get("include_archived") != "true":
        sql += " AND c.status != 'ARCHIVED'"
    sql += " GROUP BY c.id ORDER BY c.updated_at DESC LIMIT 100"
    with closing(connect(database_path)) as connection:
        rows = connection.execute(sql, args).fetchall()
    return [dict(row) for row in rows]


def get_conversation(database_path: Path, context: AuthenticatedContext, conversation_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        conversation = connection.execute(
            "SELECT * FROM conversations WHERE id = ? AND user_id = ?",
            (conversation_id, context.user["id"]),
        ).fetchone()
        if not conversation:
            raise AuthError("NOT_FOUND", "Conversation not found.", 404)
        messages = connection.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at, rowid",
            (conversation_id,),
        ).fetchall()
    return dict(conversation) | {"messages": [message_dict(row) for row in messages]}


def update_conversation(database_path: Path, context: AuthenticatedContext, conversation_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    current = get_conversation(database_path, context, conversation_id)
    title = str(payload.get("title", current["title"])).strip()[:160] or current["title"]
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute("UPDATE conversations SET title = ?, updated_at = ? WHERE id = ? AND user_id = ?", (title, iso_now(), conversation_id, context.user["id"]))
    activity(database_path, context, "CONVERSATION_UPDATED", "CONVERSATION", conversation_id, f"Renamed conversation {title}", request_id)
    return get_conversation(database_path, context, conversation_id)


def conversation_action(database_path: Path, context: AuthenticatedContext, conversation_id: str, action: str, request_id: str) -> dict[str, Any]:
    current = get_conversation(database_path, context, conversation_id)
    now = iso_now()
    with closing(connect(database_path)) as connection:
        with connection:
            if action == "archive":
                connection.execute("UPDATE conversations SET status = 'ARCHIVED', archived_at = ?, updated_at = ? WHERE id = ?", (now, now, conversation_id))
            elif action == "restore":
                connection.execute("UPDATE conversations SET status = 'ACTIVE', archived_at = NULL, updated_at = ? WHERE id = ?", (now, conversation_id))
            else:
                raise AuthError("VALIDATION_ERROR", "Unsupported conversation action.", 400)
    activity(database_path, context, f"CONVERSATION_{action.upper()}", "CONVERSATION", conversation_id, f"{action.title()} conversation {current['title']}", request_id)
    return get_conversation(database_path, context, conversation_id)


def delete_conversation(database_path: Path, context: AuthenticatedContext, conversation_id: str, request_id: str) -> dict[str, Any]:
    archived = conversation_action(database_path, context, conversation_id, "archive", request_id)
    audit(database_path, "CONVERSATION_DELETE_REQUESTED", context, request_id, "CONVERSATION", conversation_id)
    return archived


def export_conversation(database_path: Path, context: AuthenticatedContext, conversation_id: str) -> str:
    conversation = get_conversation(database_path, context, conversation_id)
    lines = [f"# {conversation['title']}", ""]
    for message in conversation["messages"]:
        lines.append(f"## {message['role'].title()} - {message['created_at']}")
        lines.append("")
        lines.append(message["content"])
        lines.append("")
    return "\n".join(lines)


def append_message(database_path: Path, context: AuthenticatedContext, conversation_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    get_conversation(database_path, context, conversation_id)
    role = str(payload.get("role", "USER")).upper()
    if role not in ROLES:
        raise AuthError("VALIDATION_ERROR", "Invalid message role.", 400)
    content = required_content(payload)
    message_id = insert_message(database_path, conversation_id, role, content)
    touch_conversation(database_path, conversation_id)
    refresh_conversation_index(database_path, context, conversation_id)
    activity(database_path, context, "CONVERSATION_MESSAGE_ADDED", "CONVERSATION", conversation_id, f"Added {role.lower()} message", request_id)
    return get_message(database_path, context, message_id)


def chat(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str, stream: bool = False) -> dict[str, Any]:
    conversation_id = str(payload.get("conversation_id") or "")
    if conversation_id:
        conversation = get_conversation(database_path, context, conversation_id)
    else:
        conversation = create_conversation(database_path, context, {"title": suggest_title(str(payload.get("message", "")))}, request_id)
        conversation_id = conversation["id"]
    user_message = append_message(database_path, context, conversation_id, {"role": "USER", "content": required_text(payload, "message")}, request_id)
    gateway_response = generate_text(database_path, context, conversation_id, str(payload["message"]), payload)
    assistant_id = insert_message(
        database_path,
        conversation_id,
        "ASSISTANT",
        gateway_response.text,
        provider=gateway_response.provider,
        model=gateway_response.model,
        prompt_version=gateway_response.prompt_version,
        token_usage={"request_tokens": gateway_response.request_tokens, "response_tokens": gateway_response.response_tokens},
        structured_payload=gateway_response.structured_payload,
    )
    touch_conversation(database_path, conversation_id)
    record_usage(database_path, context, conversation_id, assistant_id, gateway_response, "SUCCEEDED")
    refresh_conversation_index(database_path, context, conversation_id)
    activity(database_path, context, "ASSISTANT_RESPONSE_CREATED", "CONVERSATION", conversation_id, "Generated advisory assistant response", request_id)
    return {
        "conversation": get_conversation(database_path, context, conversation_id),
        "user_message": user_message,
        "assistant_message": get_message(database_path, context, assistant_id),
        "stream": {"chunks": gateway_response.chunks, "completed": True, "cancelled": False} if stream else None,
    }


def retry_last(database_path: Path, context: AuthenticatedContext, conversation_id: str, request_id: str) -> dict[str, Any]:
    conversation = get_conversation(database_path, context, conversation_id)
    user_messages = [message for message in conversation["messages"] if message["role"] == "USER"]
    if not user_messages:
        raise AuthError("VALIDATION_ERROR", "No user message to retry.", 400)
    return chat(database_path, context, {"conversation_id": conversation_id, "message": user_messages[-1]["content"]}, request_id)


def get_settings(database_path: Path, context: AuthenticatedContext) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM ai_settings WHERE user_id = ?", (context.user["id"],)).fetchone()
        if not row:
            with connection:
                connection.execute("INSERT INTO ai_settings(user_id) VALUES (?)", (context.user["id"],))
            row = connection.execute("SELECT * FROM ai_settings WHERE user_id = ?", (context.user["id"],)).fetchone()
    return dict(row)


def update_settings(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    current = get_settings(database_path, context)
    provider = str(payload.get("provider", current["provider"])).lower()
    if provider not in PROVIDERS:
        raise AuthError("VALIDATION_ERROR", "Provider must be mock, hosted, or local.", 400)
    model = str(payload.get("model", default_model(provider))).strip() or default_model(provider)
    temperature = float(payload.get("temperature", current["temperature"]))
    max_tokens = int(payload.get("max_tokens", current["max_tokens"]))
    timeout_seconds = int(payload.get("timeout_seconds", current["timeout_seconds"]))
    if not 0 <= temperature <= 2 or not 1 <= max_tokens <= 8192 or not 1 <= timeout_seconds <= 300:
        raise AuthError("VALIDATION_ERROR", "Invalid AI setting value.", 400)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                UPDATE ai_settings
                SET provider = ?, model = ?, temperature = ?, max_tokens = ?, timeout_seconds = ?, updated_at = ?
                WHERE user_id = ?
                """,
                (provider, model, temperature, max_tokens, timeout_seconds, iso_now(), context.user["id"]),
            )
    activity(database_path, context, "AI_SETTINGS_UPDATED", "AI_SETTINGS", context.user["id"], f"Switched AI provider to {provider}", request_id)
    return get_settings(database_path, context)


def list_prompts(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    seed_prompts(database_path)
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            """
            SELECT p.*, pv.version AS active_version, pv.content AS active_content
            FROM prompts p
            LEFT JOIN prompt_versions pv ON pv.prompt_id = p.id AND pv.is_active = 1
            ORDER BY p.category, p.name
            """
        ).fetchall()
    return [dict(row) for row in rows]


def list_usage(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM ai_usage WHERE user_id = ? ORDER BY created_at DESC LIMIT 100", (context.user["id"],)).fetchall()
    return [dict(row) for row in rows]


def provider_health(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    settings = get_settings(database_path, context)
    check_provider(database_path, str(settings["provider"]), str(settings["model"]))
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM provider_health ORDER BY checked_at DESC").fetchall()
    return [dict(row) for row in rows]


def search_conversations(database_path: Path, context: AuthenticatedContext, query: dict[str, str]) -> list[dict[str, Any]]:
    term = query.get("q", "").strip()
    if not term:
        return []
    try:
        return search_conversations_fts(database_path, context, term, query.get("include_archived") == "true")
    except Exception:
        return search_conversations_like(database_path, context, term, query.get("include_archived") == "true")


def generate_text(database_path: Path, context: AuthenticatedContext, conversation_id: str, message: str, payload: dict[str, Any]) -> GatewayResponse:
    seed_prompts(database_path)
    settings = get_settings(database_path, context)
    provider = str(payload.get("provider", settings["provider"])).lower()
    if provider not in PROVIDERS:
        raise AuthError("VALIDATION_ERROR", "Unsupported AI provider.", 400)
    model = str(payload.get("model", settings["model"] or default_model(provider)))
    prompt = active_prompt(database_path, DEFAULT_PROMPT_NAME)
    started = time.perf_counter()
    if provider == "mock":
        text = mock_response(message, conversation_id)
        status = "HEALTHY"
        health_message = "Mock provider ready."
    elif provider == "hosted":
        text = hosted_response()
        status = "UNAVAILABLE"
        health_message = "Hosted provider adapter is configured but network calls are disabled in Phase 6 local mode."
    else:
        text = local_response()
        status = "UNAVAILABLE"
        health_message = "Local provider adapter is configured; connect an inference server in a later hardening pass."
    latency_ms = int((time.perf_counter() - started) * 1000)
    upsert_provider_health(database_path, provider, model, status, latency_ms, health_message)
    structured = validate_structured_response(
        {
            "schema_name": "assistant.advisory_response",
            "schema_version": "1.0",
            "payload": {"answer": text, "side_effects": [], "read_only": True},
        }
    )
    return GatewayResponse(
        text=text,
        provider=provider,
        model=model,
        prompt_version=str(prompt["version"]),
        request_tokens=estimate_tokens(prompt["content"]) + estimate_tokens(message),
        response_tokens=estimate_tokens(text),
        latency_ms=latency_ms,
        estimated_cost=0.0,
        structured_payload=structured,
        chunks=chunk_text(text),
    )


def generate_structured(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    response = generate_text(database_path, context, str(payload.get("conversation_id", "")), required_text(payload, "message"), payload)
    audit(database_path, "ASSISTANT_STRUCTURED_GENERATED", context, request_id, "AI_GATEWAY", response.provider)
    return response.structured_payload


def validate_structured_response(value: dict[str, Any]) -> dict[str, Any]:
    if set(value) != {"schema_name", "schema_version", "payload"}:
        raise AuthError("AI_RESPONSE_INVALID", "Structured response has invalid fields.", 502)
    if value["schema_name"] != "assistant.advisory_response" or value["schema_version"] != "1.0":
        raise AuthError("AI_RESPONSE_INVALID", "Structured response schema is unsupported.", 502)
    payload = value["payload"]
    if not isinstance(payload, dict) or not isinstance(payload.get("answer"), str):
        raise AuthError("AI_RESPONSE_INVALID", "Structured response payload is invalid.", 502)
    if payload.get("side_effects") != [] or payload.get("read_only") is not True:
        raise AuthError("AI_RESPONSE_REJECTED", "AI response attempted side effects.", 502)
    if len(payload["answer"]) > MAX_MESSAGE_CHARS:
        raise AuthError("AI_RESPONSE_TOO_LARGE", "AI response is too large.", 502)
    return value


def seed_prompts(database_path: Path) -> None:
    with closing(connect(database_path)) as connection:
        existing = connection.execute("SELECT id FROM prompts WHERE name = ?", (DEFAULT_PROMPT_NAME,)).fetchone()
        if existing:
            return
        prompt_id = str(uuid.uuid4())
        version_id = str(uuid.uuid4())
        with connection:
            connection.execute(
                "INSERT INTO prompts(id, name, category, description) VALUES (?, ?, 'conversation', ?)",
                (prompt_id, DEFAULT_PROMPT_NAME, "Read-only advisory conversation prompt."),
            )
            connection.execute(
                """
                INSERT INTO prompt_versions(id, prompt_id, version, content, is_active)
                VALUES (?, ?, ?, ?, 1)
                """,
                (
                    version_id,
                    prompt_id,
                    DEFAULT_PROMPT_VERSION,
                    "You are the Day-to-Day Assistant. Answer clearly and helpfully. You are advisory only and must not claim to modify tasks, notes, calendars, reminders, files, or settings.",
                ),
            )


def active_prompt(database_path: Path, name: str) -> dict[str, Any]:
    seed_prompts(database_path)
    with closing(connect(database_path)) as connection:
        row = connection.execute(
            """
            SELECT p.name, pv.version, pv.content
            FROM prompts p
            JOIN prompt_versions pv ON pv.prompt_id = p.id
            WHERE p.name = ? AND pv.is_active = 1
            """,
            (name,),
        ).fetchone()
    if not row:
        raise AuthError("PROMPT_NOT_FOUND", "Prompt not found.", 500)
    return dict(row)


def insert_message(
    database_path: Path,
    conversation_id: str,
    role: str,
    content: str,
    provider: str | None = None,
    model: str | None = None,
    prompt_version: str | None = None,
    token_usage: dict[str, Any] | None = None,
    structured_payload: dict[str, Any] | None = None,
) -> str:
    if len(content) > MAX_MESSAGE_CHARS:
        raise AuthError("VALIDATION_ERROR", "Message is too large.", 400)
    message_id = str(uuid.uuid4())
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO messages(id, conversation_id, role, content, provider, model, prompt_version, token_usage, structured_payload)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    message_id,
                    conversation_id,
                    role,
                    content,
                    provider,
                    model,
                    prompt_version,
                    json.dumps(token_usage or {}),
                    json.dumps(structured_payload) if structured_payload else None,
                ),
            )
    return message_id


def get_message(database_path: Path, context: AuthenticatedContext, message_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute(
            """
            SELECT m.* FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            WHERE m.id = ? AND c.user_id = ?
            """,
            (message_id, context.user["id"]),
        ).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Message not found.", 404)
    return message_dict(row)


def touch_conversation(database_path: Path, conversation_id: str) -> None:
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (iso_now(), conversation_id))


def refresh_conversation_index(database_path: Path, context: AuthenticatedContext, conversation_id: str) -> None:
    conversation = get_conversation(database_path, context, conversation_id)
    content = "\n".join(message["content"] for message in conversation["messages"] if message["role"] in {"USER", "ASSISTANT"})
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute("DELETE FROM conversation_search_index WHERE conversation_id = ?", (conversation_id,))
            connection.execute(
                "INSERT INTO conversation_search_index(user_id, conversation_id, title, message_content) VALUES (?, ?, ?, ?)",
                (context.user["id"], conversation_id, conversation["title"], content),
            )


def record_usage(database_path: Path, context: AuthenticatedContext, conversation_id: str, message_id: str, response: GatewayResponse, status: str, error_code: str | None = None) -> None:
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO ai_usage(id, user_id, conversation_id, message_id, provider, model, prompt_version,
                                     request_tokens, response_tokens, latency_ms, estimated_cost, status, error_code)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()),
                    context.user["id"],
                    conversation_id,
                    message_id,
                    response.provider,
                    response.model,
                    response.prompt_version,
                    response.request_tokens,
                    response.response_tokens,
                    response.latency_ms,
                    response.estimated_cost,
                    status,
                    error_code,
                ),
            )


def check_provider(database_path: Path, provider: str, model: str) -> dict[str, Any]:
    started = time.perf_counter()
    status = "HEALTHY" if provider == "mock" else "UNAVAILABLE"
    message = "Mock provider ready." if provider == "mock" else f"{provider.title()} provider adapter configured; live calls are disabled in this local phase."
    latency_ms = int((time.perf_counter() - started) * 1000)
    upsert_provider_health(database_path, provider, model, status, latency_ms, message)
    return {"provider": provider, "model": model, "status": status, "latency_ms": latency_ms, "message": message}


def upsert_provider_health(database_path: Path, provider: str, model: str, status: str, latency_ms: int, message: str) -> None:
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO provider_health(id, provider, model, status, checked_at, latency_ms, message)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(provider, model) DO UPDATE SET
                  status = excluded.status,
                  checked_at = excluded.checked_at,
                  latency_ms = excluded.latency_ms,
                  message = excluded.message
                """,
                (str(uuid.uuid4()), provider, model, status, iso_now(), latency_ms, message),
            )


def search_conversations_fts(database_path: Path, context: AuthenticatedContext, term: str, include_archived: bool) -> list[dict[str, Any]]:
    fts = f'"{term.strip(chr(34))}"' if " " in term.strip(chr(34)) else f"{term}*"
    sql = """
    SELECT c.*, snippet(conversation_search_index, 3, '<mark>', '</mark>', '...', 12) AS excerpt
    FROM conversation_search_index
    JOIN conversations c ON c.id = conversation_search_index.conversation_id
    WHERE conversation_search_index.user_id = ? AND conversation_search_index MATCH ?
    """
    args: list[Any] = [context.user["id"], fts]
    if not include_archived:
        sql += " AND c.status != 'ARCHIVED'"
    sql += " ORDER BY c.updated_at DESC LIMIT 100"
    with closing(connect(database_path)) as connection:
        rows = connection.execute(sql, args).fetchall()
    return [dict(row) | {"highlighted_excerpt": str(row["excerpt"] or row["title"])} for row in rows]


def search_conversations_like(database_path: Path, context: AuthenticatedContext, term: str, include_archived: bool) -> list[dict[str, Any]]:
    sql = """
    SELECT DISTINCT c.*, c.title AS highlighted_excerpt
    FROM conversations c
    LEFT JOIN messages m ON m.conversation_id = c.id
    WHERE c.user_id = ? AND (lower(c.title) LIKE ? OR lower(COALESCE(m.content, '')) LIKE ?)
    """
    args: list[Any] = [context.user["id"], f"%{term.lower()}%", f"%{term.lower()}%"]
    if not include_archived:
        sql += " AND c.status != 'ARCHIVED'"
    sql += " ORDER BY c.updated_at DESC LIMIT 100"
    with closing(connect(database_path)) as connection:
        rows = connection.execute(sql, args).fetchall()
    return [dict(row) for row in rows]


def message_dict(row: Any) -> dict[str, Any]:
    message = dict(row)
    message["token_usage"] = json.loads(message["token_usage"] or "{}")
    message["structured_payload"] = json.loads(message["structured_payload"]) if message["structured_payload"] else None
    return message


def mock_response(message: str, conversation_id: str) -> str:
    normalized = " ".join(message.strip().split())
    if not normalized:
        normalized = "empty message"
    return (
        "Mock advisory response: I read your message as "
        f"'{normalized}'. This Phase 6 assistant is read-only, so I can explain, summarize, "
        "or help think through next steps, but I will not modify tasks, notes, calendars, reminders, or settings."
    )


def hosted_response() -> str:
    return "Hosted provider adapter is available as an abstraction, but live hosted calls are disabled in this local Phase 6 build. Switch to the mock provider for deterministic offline responses."


def local_response() -> str:
    return "Local provider adapter is available as an abstraction, but no local inference server is connected in this Phase 6 build. Switch to the mock provider for deterministic offline responses."


def chunk_text(value: str, size: int = 48) -> list[str]:
    return [value[index : index + size] for index in range(0, len(value), size)] or [""]


def estimate_tokens(value: str) -> int:
    words = len(value.split())
    return max(1, (words * 4 + 2) // 3)


def suggest_title(message: str) -> str:
    words = " ".join(message.strip().split()).split(" ")[:8]
    return " ".join(words) or "New conversation"


def default_model(provider: str) -> str:
    return {"mock": "mock-deterministic-v1", "hosted": "hosted-adapter", "local": "local-adapter"}.get(provider, "mock-deterministic-v1")


def required_content(payload: dict[str, Any]) -> str:
    content = required_text(payload, "content")
    if len(content) > MAX_MESSAGE_CHARS:
        raise AuthError("VALIDATION_ERROR", "Message is too large.", 400)
    return content


def required_text(payload: dict[str, Any], key: str) -> str:
    value = str(payload.get(key, "")).strip()
    if not value:
        raise AuthError("VALIDATION_ERROR", f"{key} is required.", 400)
    return value


def activity(database_path: Path, context: AuthenticatedContext, event_type: str, resource_type: str, resource_id: str, summary: str, request_id: str) -> None:
    record_activity(database_path, context.user["id"], event_type, resource_type, resource_id, summary)
    audit(database_path, event_type, context, request_id, resource_type, resource_id)


def audit(database_path: Path, event_type: str, context: AuthenticatedContext, request_id: str, resource_type: str, resource_id: str) -> None:
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
    )
