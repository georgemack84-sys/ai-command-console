from __future__ import annotations

import base64
import hashlib
import html
import json
import re
import uuid
from contextlib import closing
from pathlib import Path
from typing import Any

from day_to_day_assistant_api.audit import record_audit_event
from day_to_day_assistant_api.auth import AuthError, AuthenticatedContext
from day_to_day_assistant_api.database import connect
from day_to_day_assistant_api.productivity import iso_now, record_activity, text_or_none


NOTE_STATUSES = {"ACTIVE", "ARCHIVED"}
TARGET_TYPES = {"NOTE", "TASK", "EVENT", "FOLLOW_UP", "REMINDER", "PROJECT"}
RELATIONSHIP_TYPES = {"REFERENCE", "BACKGROUND", "MEETING_NOTES", "PREPARATION", "OUTCOME", "RELATED"}
MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024


def ensure_default_notebook(database_path: Path, context: AuthenticatedContext) -> str:
    with closing(connect(database_path)) as connection:
        row = connection.execute(
            "SELECT id FROM notebooks WHERE user_id = ? AND is_default = 1 AND is_archived = 0",
            (context.user["id"],),
        ).fetchone()
        if row:
            return str(row["id"])
        notebook_id = str(uuid.uuid4())
        with connection:
            connection.execute(
                """
                INSERT INTO notebooks(id, user_id, name, description, color_key, position, is_default)
                VALUES (?, ?, 'General', 'Default local notebook', 'blue', 0, 1)
                """,
                (notebook_id, context.user["id"]),
            )
        return notebook_id


def create_notebook(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    notebook_id = str(uuid.uuid4())
    name = required_text(payload, "name")
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO notebooks(id, user_id, name, description, color_key, position)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    notebook_id,
                    context.user["id"],
                    name,
                    text_or_none(payload.get("description")),
                    str(payload.get("color_key", "blue")),
                    int(payload.get("position", 0)),
                ),
            )
    activity(database_path, context, "NOTEBOOK_CREATED", "NOTEBOOK", notebook_id, f"Created notebook {name}", request_id)
    return get_notebook(database_path, context, notebook_id)


def list_notebooks(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    ensure_default_notebook(database_path, context)
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            "SELECT * FROM notebooks WHERE user_id = ? AND is_archived = 0 ORDER BY is_default DESC, position, name",
            (context.user["id"],),
        ).fetchall()
    return [dict(row) for row in rows]


def get_notebook(database_path: Path, context: AuthenticatedContext, notebook_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM notebooks WHERE id = ? AND user_id = ?", (notebook_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Notebook not found.", 404)
    return dict(row)


def update_notebook(database_path: Path, context: AuthenticatedContext, notebook_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    current = get_notebook(database_path, context, notebook_id)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                UPDATE notebooks
                SET name = ?, description = ?, color_key = ?, position = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (
                    str(payload.get("name", current["name"])).strip(),
                    text_or_none(payload.get("description", current["description"])),
                    str(payload.get("color_key", current["color_key"])),
                    int(payload.get("position", current["position"])),
                    iso_now(),
                    notebook_id,
                    context.user["id"],
                ),
            )
    reindex_user_notes(database_path, context)
    activity(database_path, context, "NOTEBOOK_UPDATED", "NOTEBOOK", notebook_id, f"Updated notebook {current['name']}", request_id)
    return get_notebook(database_path, context, notebook_id)


def notebook_action(database_path: Path, context: AuthenticatedContext, notebook_id: str, action: str, request_id: str) -> dict[str, Any]:
    current = get_notebook(database_path, context, notebook_id)
    now = iso_now()
    with closing(connect(database_path)) as connection:
        with connection:
            if action == "set-default":
                connection.execute("UPDATE notebooks SET is_default = 0 WHERE user_id = ?", (context.user["id"],))
                connection.execute("UPDATE notebooks SET is_default = 1, is_archived = 0, updated_at = ? WHERE id = ?", (now, notebook_id))
            elif action == "archive":
                if current["is_default"]:
                    raise AuthError("VALIDATION_ERROR", "Default notebook cannot be archived.", 400)
                connection.execute("UPDATE notebooks SET is_archived = 1, updated_at = ? WHERE id = ?", (now, notebook_id))
            elif action == "restore":
                connection.execute("UPDATE notebooks SET is_archived = 0, updated_at = ? WHERE id = ?", (now, notebook_id))
            else:
                raise AuthError("VALIDATION_ERROR", "Unsupported notebook action.", 400)
    activity(database_path, context, f"NOTEBOOK_{action.upper().replace('-', '_')}", "NOTEBOOK", notebook_id, f"{action} notebook {current['name']}", request_id)
    return get_notebook(database_path, context, notebook_id)


def delete_notebook(database_path: Path, context: AuthenticatedContext, notebook_id: str, request_id: str) -> dict[str, Any]:
    current = get_notebook(database_path, context, notebook_id)
    if current["is_default"]:
        raise AuthError("VALIDATION_ERROR", "Default notebook cannot be deleted.", 400)
    with closing(connect(database_path)) as connection:
        count = connection.execute("SELECT COUNT(*) AS count FROM notes WHERE notebook_id = ?", (notebook_id,)).fetchone()["count"]
        if count:
            raise AuthError("VALIDATION_ERROR", "Notebook has notes and cannot be deleted without reassignment.", 400)
        with connection:
            connection.execute("DELETE FROM notebooks WHERE id = ? AND user_id = ?", (notebook_id, context.user["id"]))
    activity(database_path, context, "NOTEBOOK_DELETED", "NOTEBOOK", notebook_id, f"Deleted notebook {current['name']}", request_id)
    return current


def create_note(database_path: Path, context: AuthenticatedContext, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    note_id = str(uuid.uuid4())
    notebook_id = str(payload.get("notebook_id") or ensure_default_notebook(database_path, context))
    get_notebook(database_path, context, notebook_id)
    title = required_text(payload, "title")
    content = str(payload.get("content_markdown", ""))
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO notes(id, user_id, notebook_id, title, content_markdown, summary, status, is_favorite, pinned_at)
                VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
                """,
                (
                    note_id,
                    context.user["id"],
                    notebook_id,
                    title,
                    content,
                    text_or_none(payload.get("summary")),
                    1 if bool(payload.get("is_favorite", False)) else 0,
                    iso_now() if bool(payload.get("is_favorite", False)) else None,
                ),
            )
            insert_version(connection, note_id, 1, title, content, text_or_none(payload.get("summary")))
    set_note_tags(database_path, context, note_id, payload.get("tags", []))
    refresh_note_index(database_path, context, note_id)
    activity(database_path, context, "NOTE_CREATED", "NOTE", note_id, f"Created note {title}", request_id)
    return get_note(database_path, context, note_id)


def list_notes(database_path: Path, context: AuthenticatedContext, query: dict[str, str] | None = None) -> list[dict[str, Any]]:
    query = query or {}
    ensure_default_notebook(database_path, context)
    sql = "SELECT n.* FROM notes n WHERE n.user_id = ?"
    args: list[Any] = [context.user["id"]]
    if query.get("include_archived") != "true":
        sql += " AND n.status != 'ARCHIVED'"
    if query.get("notebook_id"):
        sql += " AND n.notebook_id = ?"
        args.append(query["notebook_id"])
    if query.get("favorite") == "true":
        sql += " AND n.is_favorite = 1"
    if query.get("tag"):
        sql += """
        AND EXISTS (
          SELECT 1 FROM note_tags nt
          JOIN tags t ON t.id = nt.tag_id
          WHERE nt.note_id = n.id AND t.user_id = n.user_id AND lower(t.name) = ?
        )
        """
        args.append(query["tag"].lower())
    sql += " ORDER BY n.is_favorite DESC, n.pinned_at DESC, n.updated_at DESC LIMIT 200"
    with closing(connect(database_path)) as connection:
        rows = connection.execute(sql, args).fetchall()
    return [hydrate_note(database_path, context, row) for row in rows]


def get_note(database_path: Path, context: AuthenticatedContext, note_id: str, mark_viewed: bool = False) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute("SELECT * FROM notes WHERE id = ? AND user_id = ?", (note_id, context.user["id"])).fetchone()
        if mark_viewed and row:
            with connection:
                connection.execute("UPDATE notes SET last_viewed_at = ? WHERE id = ?", (iso_now(), note_id))
    if not row:
        raise AuthError("NOT_FOUND", "Note not found.", 404)
    return hydrate_note(database_path, context, row)


def update_note(database_path: Path, context: AuthenticatedContext, note_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    current = get_note(database_path, context, note_id)
    expected_version = payload.get("version")
    if expected_version is not None and int(expected_version) != int(current["version"]):
        raise AuthError("STALE_RECORD", "Note was updated by another request.", 409)
    notebook_id = str(payload.get("notebook_id", current["notebook_id"]))
    get_notebook(database_path, context, notebook_id)
    title = required_text(payload, "title") if "title" in payload else current["title"]
    content = str(payload.get("content_markdown", current["content_markdown"]))
    summary = text_or_none(payload.get("summary", current["summary"]))
    favorite = 1 if bool(payload.get("is_favorite", current["is_favorite"])) else 0
    new_version = int(current["version"]) + 1
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                UPDATE notes
                SET notebook_id = ?, title = ?, content_markdown = ?, summary = ?, is_favorite = ?,
                    pinned_at = ?, version = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (
                    notebook_id,
                    title,
                    content,
                    summary,
                    favorite,
                    iso_now() if favorite and not current["pinned_at"] else current["pinned_at"],
                    new_version,
                    iso_now(),
                    note_id,
                    context.user["id"],
                ),
            )
            if material_edit(current, title, content, summary):
                insert_version(connection, note_id, new_version, title, content, summary)
    if "tags" in payload:
        set_note_tags(database_path, context, note_id, payload["tags"])
    refresh_note_index(database_path, context, note_id)
    activity(database_path, context, "NOTE_UPDATED", "NOTE", note_id, f"Updated note {title}", request_id)
    return get_note(database_path, context, note_id)


def note_action(database_path: Path, context: AuthenticatedContext, note_id: str, action: str, request_id: str) -> dict[str, Any]:
    current = get_note(database_path, context, note_id)
    now = iso_now()
    with closing(connect(database_path)) as connection:
        with connection:
            if action == "archive":
                connection.execute("UPDATE notes SET status = 'ARCHIVED', archived_at = ?, updated_at = ? WHERE id = ?", (now, now, note_id))
            elif action == "restore":
                connection.execute("UPDATE notes SET status = 'ACTIVE', archived_at = NULL, updated_at = ? WHERE id = ?", (now, note_id))
            elif action == "favorite":
                connection.execute("UPDATE notes SET is_favorite = 1, pinned_at = COALESCE(pinned_at, ?), updated_at = ? WHERE id = ?", (now, now, note_id))
            elif action == "unfavorite":
                connection.execute("UPDATE notes SET is_favorite = 0, pinned_at = NULL, updated_at = ? WHERE id = ?", (now, note_id))
            else:
                raise AuthError("VALIDATION_ERROR", "Unsupported note action.", 400)
    refresh_note_index(database_path, context, note_id)
    activity(database_path, context, f"NOTE_{action.upper()}", "NOTE", note_id, f"{action.title()} note {current['title']}", request_id)
    return get_note(database_path, context, note_id)


def delete_note(database_path: Path, context: AuthenticatedContext, note_id: str, request_id: str) -> dict[str, Any]:
    archived = note_action(database_path, context, note_id, "archive", request_id)
    audit(database_path, "NOTE_DELETE_REQUESTED", context, request_id, "NOTE", note_id)
    return archived


def list_versions(database_path: Path, context: AuthenticatedContext, note_id: str) -> list[dict[str, Any]]:
    get_note(database_path, context, note_id)
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM note_versions WHERE note_id = ? ORDER BY version_number DESC", (note_id,)).fetchall()
    return [dict(row) for row in rows]


def restore_version(database_path: Path, context: AuthenticatedContext, note_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    current = get_note(database_path, context, note_id)
    version_number = int(payload.get("version_number", 0))
    with closing(connect(database_path)) as connection:
        version = connection.execute(
            "SELECT * FROM note_versions WHERE note_id = ? AND version_number = ?",
            (note_id, version_number),
        ).fetchone()
        if not version:
            raise AuthError("NOT_FOUND", "Note version not found.", 404)
        next_version = int(current["version"]) + 1
        with connection:
            connection.execute(
                """
                UPDATE notes
                SET title = ?, content_markdown = ?, summary = ?, version = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (version["title"], version["content_markdown"], version["summary"], next_version, iso_now(), note_id, context.user["id"]),
            )
            insert_version(connection, note_id, next_version, version["title"], version["content_markdown"], version["summary"])
    refresh_note_index(database_path, context, note_id)
    activity(database_path, context, "NOTE_VERSION_RESTORED", "NOTE", note_id, f"Restored version {version_number}", request_id)
    return get_note(database_path, context, note_id)


def add_attachment(database_path: Path, context: AuthenticatedContext, note_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    note = get_note(database_path, context, note_id)
    filename = Path(required_text(payload, "filename")).name
    media_type = str(payload.get("media_type", "application/octet-stream"))
    raw = attachment_bytes(payload)
    if len(raw) > MAX_ATTACHMENT_BYTES:
        raise AuthError("VALIDATION_ERROR", "Attachment exceeds the local size limit.", 400)
    checksum = hashlib.sha256(raw).hexdigest()
    attachment_id = str(uuid.uuid4())
    storage_dir = database_path.parent / "attachments" / context.user["id"] / note_id
    storage_dir.mkdir(parents=True, exist_ok=True)
    storage_path = storage_dir / f"{attachment_id}_{safe_filename(filename)}"
    with closing(connect(database_path)) as connection:
        duplicate = connection.execute(
            "SELECT * FROM attachments WHERE note_id = ? AND checksum = ?",
            (note_id, checksum),
        ).fetchone()
        if duplicate:
            raise AuthError("DUPLICATE_ATTACHMENT", "This attachment already exists on the note.", 409)
        storage_path.write_bytes(raw)
        with connection:
            connection.execute(
                """
                INSERT INTO attachments(id, note_id, filename, media_type, size_bytes, checksum, storage_path)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (attachment_id, note_id, filename, media_type, len(raw), checksum, str(storage_path)),
            )
    refresh_note_index(database_path, context, note_id)
    activity(database_path, context, "ATTACHMENT_ADDED", "NOTE", note_id, f"Added attachment {filename} to {note['title']}", request_id)
    return get_attachment(database_path, context, attachment_id)


def list_attachments(database_path: Path, context: AuthenticatedContext, note_id: str | None = None) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        if note_id:
            ensure_note_owner(connection, context, note_id)
            rows = connection.execute("SELECT * FROM attachments WHERE note_id = ? ORDER BY uploaded_at DESC", (note_id,)).fetchall()
        else:
            rows = connection.execute(
                """
                SELECT a.* FROM attachments a
                JOIN notes n ON n.id = a.note_id
                WHERE n.user_id = ? AND n.status != 'ARCHIVED'
                ORDER BY a.uploaded_at DESC
                LIMIT 200
                """,
                (context.user["id"],),
            ).fetchall()
    return [dict(row) for row in rows]


def get_attachment(database_path: Path, context: AuthenticatedContext, attachment_id: str) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute(
            """
            SELECT a.* FROM attachments a
            JOIN notes n ON n.id = a.note_id
            WHERE a.id = ? AND n.user_id = ?
            """,
            (attachment_id, context.user["id"]),
        ).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Attachment not found.", 404)
    return dict(row)


def remove_attachment(database_path: Path, context: AuthenticatedContext, attachment_id: str, request_id: str) -> dict[str, Any]:
    attachment = get_attachment(database_path, context, attachment_id)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute("DELETE FROM attachments WHERE id = ?", (attachment_id,))
    refresh_note_index(database_path, context, attachment["note_id"])
    activity(database_path, context, "ATTACHMENT_REMOVED", "NOTE", attachment["note_id"], f"Removed attachment {attachment['filename']}", request_id)
    return attachment


def create_link(database_path: Path, context: AuthenticatedContext, note_id: str, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    get_note(database_path, context, note_id)
    target_type = str(payload.get("target_type", "NOTE")).upper()
    relationship_type = str(payload.get("relationship_type", "RELATED")).upper()
    target_id = required_text(payload, "target_id")
    if target_type not in TARGET_TYPES or relationship_type not in RELATIONSHIP_TYPES:
        raise AuthError("VALIDATION_ERROR", "Invalid note link vocabulary.", 400)
    validate_target(database_path, context, target_type, target_id)
    link_id = str(uuid.uuid4())
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT OR IGNORE INTO note_links(id, source_note_id, target_type, target_id, relationship_type)
                VALUES (?, ?, ?, ?, ?)
                """,
                (link_id, note_id, target_type, target_id, relationship_type),
            )
    activity(database_path, context, "NOTE_LINK_CREATED", "NOTE", note_id, f"Linked note to {target_type.lower()}", request_id)
    return {"id": link_id, "source_note_id": note_id, "target_type": target_type, "target_id": target_id, "relationship_type": relationship_type}


def list_links(database_path: Path, context: AuthenticatedContext, note_id: str) -> dict[str, list[dict[str, Any]]]:
    with closing(connect(database_path)) as connection:
        ensure_note_owner(connection, context, note_id)
        outbound = connection.execute("SELECT * FROM note_links WHERE source_note_id = ? ORDER BY created_at DESC", (note_id,)).fetchall()
        inbound = connection.execute(
            """
            SELECT l.* FROM note_links l
            JOIN notes n ON n.id = l.source_note_id
            WHERE l.target_type = 'NOTE' AND l.target_id = ? AND n.user_id = ?
            ORDER BY l.created_at DESC
            """,
            (note_id, context.user["id"]),
        ).fetchall()
    return {"outbound": [dict(row) for row in outbound], "backlinks": [dict(row) for row in inbound]}


def list_tags(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT * FROM tags WHERE user_id = ? ORDER BY name", (context.user["id"],)).fetchall()
    return [dict(row) for row in rows]


def search(database_path: Path, context: AuthenticatedContext, query: dict[str, str]) -> list[dict[str, Any]]:
    term = query.get("q", "").strip()
    if not term:
        return []
    include_archived = query.get("include_archived") == "true"
    notebook_id = query.get("notebook_id")
    tag = query.get("tag")
    try:
        note_results = search_fts(database_path, context, term, include_archived, notebook_id, tag)
    except Exception:
        note_results = search_like(database_path, context, term, include_archived, notebook_id, tag)
    attachment_results = search_attachments(database_path, context, term, include_archived, notebook_id, tag)
    return sorted(note_results + attachment_results, key=lambda item: (-float(item["relevance_score"]), item["title"].lower(), item["record_id"]))[:100]


def search_fts(database_path: Path, context: AuthenticatedContext, term: str, include_archived: bool, notebook_id: str | None, tag: str | None) -> list[dict[str, Any]]:
    fts_query = normalize_fts_query(term)
    sql = """
    SELECT n.id, n.title, n.updated_at, snippet(note_search_index, 3, '<mark>', '</mark>', '...', 12) AS excerpt,
           bm25(note_search_index) AS rank
    FROM note_search_index
    JOIN notes n ON n.id = note_search_index.note_id
    WHERE note_search_index.user_id = ? AND note_search_index MATCH ?
    """
    args: list[Any] = [context.user["id"], fts_query]
    sql, args = append_note_filters(sql, args, include_archived, notebook_id, tag)
    sql += " ORDER BY rank, n.is_favorite DESC, n.updated_at DESC LIMIT 100"
    with closing(connect(database_path)) as connection:
        rows = connection.execute(sql, args).fetchall()
    return [
        {
            "record_type": "NOTE",
            "record_id": row["id"],
            "title": row["title"],
            "highlighted_excerpt": sanitize_highlight(row["excerpt"] or row["title"]),
            "relevance_score": 1 / (1 + abs(float(row["rank"]))),
        }
        for row in rows
    ]


def search_like(database_path: Path, context: AuthenticatedContext, term: str, include_archived: bool, notebook_id: str | None, tag: str | None) -> list[dict[str, Any]]:
    lowered = term.lower().strip('"')
    sql = """
    SELECT n.* FROM notes n
    JOIN notebooks nb ON nb.id = n.notebook_id
    WHERE n.user_id = ? AND (
      lower(n.title) LIKE ? OR lower(n.content_markdown) LIKE ? OR lower(nb.name) LIKE ?
    )
    """
    like = f"%{lowered}%"
    args: list[Any] = [context.user["id"], like, like, like]
    sql, args = append_note_filters(sql, args, include_archived, notebook_id, tag)
    sql += " ORDER BY n.is_favorite DESC, n.updated_at DESC LIMIT 100"
    with closing(connect(database_path)) as connection:
        rows = connection.execute(sql, args).fetchall()
    return [
        {
            "record_type": "NOTE",
            "record_id": row["id"],
            "title": row["title"],
            "highlighted_excerpt": highlighted_excerpt(row["content_markdown"], lowered),
            "relevance_score": score_note(row, lowered),
        }
        for row in rows
    ]


def search_attachments(database_path: Path, context: AuthenticatedContext, term: str, include_archived: bool, notebook_id: str | None, tag: str | None) -> list[dict[str, Any]]:
    lowered = term.lower().strip('"')
    sql = """
    SELECT a.*, n.title AS note_title FROM attachments a
    JOIN notes n ON n.id = a.note_id
    WHERE n.user_id = ? AND lower(a.filename) LIKE ?
    """
    args: list[Any] = [context.user["id"], f"%{lowered}%"]
    sql, args = append_note_filters(sql, args, include_archived, notebook_id, tag)
    sql += " ORDER BY a.uploaded_at DESC LIMIT 50"
    with closing(connect(database_path)) as connection:
        rows = connection.execute(sql, args).fetchall()
    return [
        {
            "record_type": "ATTACHMENT",
            "record_id": row["id"],
            "title": row["filename"],
            "highlighted_excerpt": f"Attachment on {row['note_title']}",
            "relevance_score": 0.8,
        }
        for row in rows
    ]


def append_note_filters(sql: str, args: list[Any], include_archived: bool, notebook_id: str | None, tag: str | None) -> tuple[str, list[Any]]:
    if not include_archived:
        sql += " AND n.status != 'ARCHIVED'"
    if notebook_id:
        sql += " AND n.notebook_id = ?"
        args.append(notebook_id)
    if tag:
        sql += """
        AND EXISTS (
          SELECT 1 FROM note_tags nt
          JOIN tags t ON t.id = nt.tag_id
          WHERE nt.note_id = n.id AND t.user_id = n.user_id AND lower(t.name) = ?
        )
        """
        args.append(tag.lower())
    return sql, args


def hydrate_note(database_path: Path, context: AuthenticatedContext, row: Any) -> dict[str, Any]:
    note = dict(row)
    note["is_favorite"] = bool(note["is_favorite"])
    note["word_count"] = len(re.findall(r"\b\w+\b", note["content_markdown"]))
    note["character_count"] = len(note["content_markdown"])
    note["reading_time_minutes"] = max(1, (note["word_count"] + 199) // 200) if note["word_count"] else 0
    note["content_html"] = markdown_preview(note["content_markdown"])
    note["tags"] = note_tags(database_path, context, note["id"])
    note["attachments"] = list_attachments(database_path, context, note["id"])
    note["links"] = list_links(database_path, context, note["id"])
    return note


def note_tags(database_path: Path, context: AuthenticatedContext, note_id: str) -> list[str]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            """
            SELECT t.name FROM tags t
            JOIN note_tags nt ON nt.tag_id = t.id
            JOIN notes n ON n.id = nt.note_id
            WHERE nt.note_id = ? AND n.user_id = ?
            ORDER BY t.name
            """,
            (note_id, context.user["id"]),
        ).fetchall()
    return [str(row["name"]) for row in rows]


def set_note_tags(database_path: Path, context: AuthenticatedContext, note_id: str, tags: Any) -> None:
    names = sorted({normalize_tag(str(tag)) for tag in coerce_tags(tags) if normalize_tag(str(tag))})
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute("DELETE FROM note_tags WHERE note_id = ?", (note_id,))
            for name in names:
                tag_id = str(uuid.uuid4())
                connection.execute("INSERT OR IGNORE INTO tags(id, user_id, name) VALUES (?, ?, ?)", (tag_id, context.user["id"], name))
                row = connection.execute("SELECT id FROM tags WHERE user_id = ? AND name = ?", (context.user["id"], name)).fetchone()
                connection.execute("INSERT OR IGNORE INTO note_tags(note_id, tag_id) VALUES (?, ?)", (note_id, row["id"]))


def refresh_note_index(database_path: Path, context: AuthenticatedContext, note_id: str) -> None:
    with closing(connect(database_path)) as connection:
        note = connection.execute(
            """
            SELECT n.*, nb.name AS notebook_name FROM notes n
            JOIN notebooks nb ON nb.id = n.notebook_id
            WHERE n.id = ? AND n.user_id = ?
            """,
            (note_id, context.user["id"]),
        ).fetchone()
        if not note:
            return
        tags = ", ".join(note_tags(database_path, context, note_id))
        attachments = ", ".join(item["filename"] for item in list_attachments(database_path, context, note_id))
        with connection:
            connection.execute("DELETE FROM note_search_index WHERE note_id = ?", (note_id,))
            connection.execute(
                """
                INSERT INTO note_search_index(user_id, note_id, title, content_markdown, notebook_name, tag_names, attachment_names)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (context.user["id"], note_id, note["title"], note["content_markdown"], note["notebook_name"], tags, attachments),
            )


def reindex_user_notes(database_path: Path, context: AuthenticatedContext) -> None:
    with closing(connect(database_path)) as connection:
        rows = connection.execute("SELECT id FROM notes WHERE user_id = ?", (context.user["id"],)).fetchall()
    for row in rows:
        refresh_note_index(database_path, context, row["id"])


def validate_target(database_path: Path, context: AuthenticatedContext, target_type: str, target_id: str) -> None:
    tables = {
        "NOTE": "notes",
        "TASK": "tasks",
        "EVENT": "calendar_events",
        "FOLLOW_UP": "followups",
        "REMINDER": "reminders",
        "PROJECT": "projects",
    }
    table = tables[target_type]
    with closing(connect(database_path)) as connection:
        row = connection.execute(f"SELECT id FROM {table} WHERE id = ? AND user_id = ?", (target_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", f"{target_type} target not found.", 404)


def ensure_note_owner(connection: Any, context: AuthenticatedContext, note_id: str) -> None:
    row = connection.execute("SELECT id FROM notes WHERE id = ? AND user_id = ?", (note_id, context.user["id"])).fetchone()
    if not row:
        raise AuthError("NOT_FOUND", "Note not found.", 404)


def insert_version(connection: Any, note_id: str, version_number: int, title: str, content: str, summary: str | None) -> None:
    connection.execute(
        """
        INSERT INTO note_versions(id, note_id, version_number, title, content_markdown, summary, author_type)
        VALUES (?, ?, ?, ?, ?, ?, 'USER')
        """,
        (str(uuid.uuid4()), note_id, version_number, title, content, summary),
    )


def material_edit(current: dict[str, Any], title: str, content: str, summary: str | None) -> bool:
    return title != current["title"] or content != current["content_markdown"] or summary != current["summary"]


def attachment_bytes(payload: dict[str, Any]) -> bytes:
    if payload.get("content_base64"):
        try:
            return base64.b64decode(str(payload["content_base64"]), validate=True)
        except Exception as exc:
            raise AuthError("VALIDATION_ERROR", "Attachment content_base64 is invalid.", 400) from exc
    if payload.get("content_text") is not None:
        return str(payload["content_text"]).encode("utf-8")
    return b""


def markdown_preview(markdown: str) -> str:
    escaped = html.escape(markdown)
    escaped = re.sub(r"^### (.*)$", r"<h3>\1</h3>", escaped, flags=re.MULTILINE)
    escaped = re.sub(r"^## (.*)$", r"<h2>\1</h2>", escaped, flags=re.MULTILINE)
    escaped = re.sub(r"^# (.*)$", r"<h1>\1</h1>", escaped, flags=re.MULTILINE)
    escaped = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"\*(.*?)\*", r"<em>\1</em>", escaped)
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    return "<p>" + escaped.replace("\n\n", "</p><p>").replace("\n", "<br>") + "</p>"


def normalize_fts_query(term: str) -> str:
    stripped = term.strip()
    if stripped.startswith('"') and stripped.endswith('"'):
        return stripped
    if any(operator in stripped.upper().split() for operator in {"AND", "OR", "NOT"}):
        return stripped
    tokens = re.findall(r"[\w-]+", stripped)
    if not tokens:
        return stripped
    return " AND ".join(f"{token}*" for token in tokens)


def highlighted_excerpt(content: str, term: str) -> str:
    index = content.lower().find(term.lower())
    if index == -1:
        return html.escape(content[:160])
    start = max(0, index - 60)
    end = min(len(content), index + len(term) + 60)
    excerpt = html.escape(content[start:end])
    return re.sub(re.escape(html.escape(term)), f"<mark>{html.escape(term)}</mark>", excerpt, flags=re.IGNORECASE)


def sanitize_highlight(value: str) -> str:
    escaped = html.escape(value)
    return escaped.replace("&lt;mark&gt;", "<mark>").replace("&lt;/mark&gt;", "</mark>")


def score_note(row: Any, term: str) -> float:
    title = str(row["title"]).lower()
    content = str(row["content_markdown"]).lower()
    score = 1.0
    if term in title:
        score += 3.0
    if term in content:
        score += 1.0
    if row["is_favorite"]:
        score += 0.5
    return score


def coerce_tags(tags: Any) -> list[str]:
    if tags is None:
        return []
    if isinstance(tags, str):
        return [tag.strip() for tag in tags.split(",")]
    if isinstance(tags, list):
        return [str(tag).strip() for tag in tags]
    return []


def normalize_tag(value: str) -> str:
    return re.sub(r"\s+", "-", value.strip().lower())


def safe_filename(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]", "_", value)[:120] or "attachment"


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


def required_text(payload: dict[str, Any], key: str) -> str:
    value = str(payload.get(key, "")).strip()
    if not value:
        raise AuthError("VALIDATION_ERROR", f"{key} is required.", 400)
    return value
