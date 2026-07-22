from __future__ import annotations

import uuid
from contextlib import closing
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from http.cookies import SimpleCookie
from pathlib import Path
from typing import Any

from day_to_day_assistant_api.audit import record_audit_event
from day_to_day_assistant_api.database import connect
from day_to_day_assistant_api.security import (
    PasswordPolicyError,
    generate_session_token,
    hash_identifier,
    hash_password,
    hash_token,
    validate_password,
    verify_password,
)


SESSION_COOKIE_NAME = "d2d_session"
STANDARD_SESSION_HOURS = 12
REMEMBER_SESSION_DAYS = 7
LOCKOUT_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


class AuthError(Exception):
    def __init__(self, code: str, message: str, status: int = 401) -> None:
        super().__init__(message)
        self.code = code
        self.status = status


@dataclass(frozen=True)
class AuthenticatedContext:
    user: dict[str, Any]
    session: dict[str, Any]


def utc_now() -> datetime:
    return datetime.now(UTC)


def iso_now() -> str:
    return utc_now().replace(microsecond=0).isoformat()


def parse_iso(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def setup_required(database_path: Path) -> bool:
    with closing(connect(database_path)) as connection:
        count = connection.execute("SELECT COUNT(*) AS count FROM users WHERE status = 'ACTIVE'").fetchone()[
            "count"
        ]
    return int(count) == 0


def public_user(row: Any) -> dict[str, Any]:
    return {
        "id": row["id"],
        "email": row["email"],
        "display_name": row["display_name"],
        "timezone": row["timezone"],
        "locale": row["locale"],
        "status": row["status"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def public_session(row: Any, current_session_id: str | None = None) -> dict[str, Any]:
    return {
        "id": row["id"],
        "status": row["status"],
        "created_at": row["created_at"],
        "last_seen_at": row["last_seen_at"],
        "expires_at": row["expires_at"],
        "revoked_at": row["revoked_at"],
        "revocation_reason": row["revocation_reason"],
        "user_agent_summary": row["user_agent_summary"] or "Unknown browser",
        "current": row["id"] == current_session_id,
    }


def create_account(database_path: Path, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
    if not setup_required(database_path):
        record_audit_event(
            database_path,
            "AUTH_ACCOUNT_SETUP_REJECTED",
            "SYSTEM",
            "DENIED",
            request_id,
            metadata={"reason": "setup_already_completed"},
        )
        raise AuthError("SETUP_UNAVAILABLE", "Account setup is no longer available.", 409)

    password = str(payload.get("password", ""))
    try:
        validate_password(password, str(payload.get("password_confirmation", "")))
    except PasswordPolicyError as exc:
        raise AuthError("PASSWORD_POLICY_VIOLATION", str(exc), 400) from exc

    email = str(payload.get("email", "")).strip().lower()
    display_name = str(payload.get("display_name", "")).strip()
    timezone = str(payload.get("timezone", "UTC")).strip() or "UTC"
    locale = str(payload.get("locale", "en-US")).strip() or "en-US"
    if not email or "@" not in email:
        raise AuthError("VALIDATION_ERROR", "A valid email is required.", 400)
    if not display_name:
        raise AuthError("VALIDATION_ERROR", "Display name is required.", 400)

    user_id = str(uuid.uuid4())
    encoded_hash = hash_password(password)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO users (
                  id, email, display_name, password_hash, timezone, locale, status,
                  password_changed_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
                """,
                (user_id, email, display_name, encoded_hash, timezone, locale, iso_now()),
            )
            connection.execute(
                "INSERT INTO user_settings(user_id, timezone, locale) VALUES (?, ?, ?)",
                (user_id, timezone, locale),
            )
            row = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    record_audit_event(
        database_path,
        "AUTH_ACCOUNT_CREATED",
        "USER",
        "SUCCEEDED",
        request_id,
        actor_id=user_id,
        resource_type="USER",
        resource_id=user_id,
        metadata={"email": email, "timezone": timezone, "locale": locale},
    )
    return public_user(row)


def authenticate(
    database_path: Path,
    identifier: str,
    password: str,
    remember_session: bool,
    request_id: str,
    user_agent: str | None,
    source_address: str | None,
) -> tuple[dict[str, Any], str]:
    user = _find_user(database_path, identifier)
    generic = "The email or password is incorrect."
    if user is None:
        record_audit_event(
            database_path,
            "AUTH_LOGIN_FAILED",
            "SYSTEM",
            "DENIED",
            request_id,
            metadata={"identifier_hash": hash_identifier(identifier), "reason": "invalid_credentials"},
        )
        raise AuthError("INVALID_CREDENTIALS", generic, 401)

    if user["status"] != "ACTIVE":
        raise AuthError(f"ACCOUNT_{user['status']}", "The account cannot sign in.", 403)

    locked_until = user["locked_until"]
    if locked_until and parse_iso(locked_until) > utc_now():
        record_audit_event(
            database_path,
            "AUTH_ACCOUNT_TEMPORARILY_LOCKED",
            "USER",
            "DENIED",
            request_id,
            actor_id=user["id"],
            metadata={"reason": "too_many_failed_attempts"},
        )
        raise AuthError("ACCOUNT_LOCKED", "The account is temporarily locked. Try again later.", 423)

    if not verify_password(password, user["password_hash"]):
        _record_failed_login(database_path, user["id"])
        record_audit_event(
            database_path,
            "AUTH_LOGIN_FAILED",
            "USER",
            "DENIED",
            request_id,
            actor_id=user["id"],
            metadata={"reason": "invalid_credentials"},
        )
        raise AuthError("INVALID_CREDENTIALS", generic, 401)

    token = generate_session_token()
    expires_at = utc_now() + (
        timedelta(days=REMEMBER_SESSION_DAYS) if remember_session else timedelta(hours=STANDARD_SESSION_HOURS)
    )
    session_id = str(uuid.uuid4())
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                INSERT INTO sessions (
                  id, user_id, token_hash, status, expires_at, user_agent_summary, source_address_hash
                ) VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?)
                """,
                (
                    session_id,
                    user["id"],
                    hash_token(token),
                    expires_at.replace(microsecond=0).isoformat(),
                    summarize_user_agent(user_agent),
                    hash_identifier(source_address or "unknown"),
                ),
            )
            connection.execute(
                """
                UPDATE users
                SET failed_login_count = 0, locked_until = NULL, last_login_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (iso_now(), iso_now(), user["id"]),
            )

    record_audit_event(
        database_path,
        "AUTH_SESSION_CREATED",
        "USER",
        "SUCCEEDED",
        request_id,
        actor_id=user["id"],
        session_id=session_id,
    )
    record_audit_event(
        database_path,
        "AUTH_LOGIN_SUCCEEDED",
        "USER",
        "SUCCEEDED",
        request_id,
        actor_id=user["id"],
        session_id=session_id,
    )
    return {
        "user": public_user(user),
        "session": {"id": session_id, "expires_at": expires_at.replace(microsecond=0).isoformat()},
    }, token


def validate_session(database_path: Path, cookie_header: str | None, request_id: str) -> AuthenticatedContext:
    token = extract_session_token(cookie_header)
    if not token:
        raise AuthError("AUTHENTICATION_REQUIRED", "Sign in to continue.", 401)
    token_digest = hash_token(token)
    with closing(connect(database_path)) as connection:
        session = connection.execute(
            "SELECT * FROM sessions WHERE token_hash = ?",
            (token_digest,),
        ).fetchone()
        if session is None:
            raise AuthError("AUTHENTICATION_REQUIRED", "Sign in to continue.", 401)
        if session["status"] == "REVOKED":
            raise AuthError("SESSION_REVOKED", "Your session was signed out.", 401)
        if parse_iso(session["expires_at"]) <= utc_now():
            with connection:
                connection.execute(
                    "UPDATE sessions SET status = 'EXPIRED' WHERE id = ?",
                    (session["id"],),
                )
            record_audit_event(
                database_path,
                "AUTH_SESSION_EXPIRED",
                "USER",
                "DENIED",
                request_id,
                actor_id=session["user_id"],
                session_id=session["id"],
            )
            raise AuthError("SESSION_EXPIRED", "Your session expired. Sign in again to continue.", 401)
        user = connection.execute("SELECT * FROM users WHERE id = ?", (session["user_id"],)).fetchone()
        if user is None or user["status"] != "ACTIVE":
            raise AuthError("ACCOUNT_DISABLED", "The account cannot access the application.", 403)
        with connection:
            connection.execute("UPDATE sessions SET last_seen_at = ? WHERE id = ?", (iso_now(), session["id"]))
    return AuthenticatedContext(user=public_user(user), session=public_session(session, session["id"]))


def logout(database_path: Path, context: AuthenticatedContext, request_id: str) -> None:
    revoke_session(database_path, context.session["id"], context, request_id, reason="logout")
    record_audit_event(
        database_path,
        "AUTH_LOGOUT",
        "USER",
        "SUCCEEDED",
        request_id,
        actor_id=context.user["id"],
        session_id=context.session["id"],
    )


def list_sessions(database_path: Path, context: AuthenticatedContext) -> list[dict[str, Any]]:
    with closing(connect(database_path)) as connection:
        rows = connection.execute(
            """
            SELECT * FROM sessions
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (context.user["id"],),
        ).fetchall()
    return [public_session(row, context.session["id"]) for row in rows]


def revoke_session(
    database_path: Path,
    session_id: str,
    context: AuthenticatedContext,
    request_id: str,
    reason: str = "revoked_by_user",
) -> None:
    with closing(connect(database_path)) as connection:
        with connection:
            row = connection.execute(
                "SELECT * FROM sessions WHERE id = ? AND user_id = ?",
                (session_id, context.user["id"]),
            ).fetchone()
            if row is None:
                raise AuthError("NOT_FOUND", "Session not found.", 404)
            connection.execute(
                """
                UPDATE sessions
                SET status = 'REVOKED', revoked_at = ?, revocation_reason = ?
                WHERE id = ?
                """,
                (iso_now(), reason, session_id),
            )
    record_audit_event(
        database_path,
        "AUTH_SESSION_REVOKED",
        "USER",
        "SUCCEEDED",
        request_id,
        actor_id=context.user["id"],
        session_id=context.session["id"],
        resource_type="SESSION",
        resource_id=session_id,
    )


def revoke_other_sessions(database_path: Path, context: AuthenticatedContext, request_id: str) -> int:
    with closing(connect(database_path)) as connection:
        with connection:
            cursor = connection.execute(
                """
                UPDATE sessions
                SET status = 'REVOKED', revoked_at = ?, revocation_reason = 'revoked_by_user'
                WHERE user_id = ? AND id != ? AND status = 'ACTIVE'
                """,
                (iso_now(), context.user["id"], context.session["id"]),
            )
            count = cursor.rowcount
    record_audit_event(
        database_path,
        "AUTH_OTHER_SESSIONS_REVOKED",
        "USER",
        "SUCCEEDED",
        request_id,
        actor_id=context.user["id"],
        session_id=context.session["id"],
        metadata={"revoked_count": count},
    )
    return int(count)


def change_password(
    database_path: Path,
    context: AuthenticatedContext,
    payload: dict[str, Any],
    request_id: str,
) -> str:
    current_password = str(payload.get("current_password", ""))
    new_password = str(payload.get("new_password", ""))
    confirmation = str(payload.get("new_password_confirmation", ""))
    with closing(connect(database_path)) as connection:
        user = connection.execute("SELECT * FROM users WHERE id = ?", (context.user["id"],)).fetchone()
    if user is None or not verify_password(current_password, user["password_hash"]):
        record_audit_event(
            database_path,
            "AUTH_PASSWORD_CHANGE_FAILED",
            "USER",
            "DENIED",
            request_id,
            actor_id=context.user["id"],
            session_id=context.session["id"],
            metadata={"reason": "invalid_current_password"},
        )
        raise AuthError("INVALID_CURRENT_PASSWORD", "The current password is incorrect.", 400)
    if verify_password(new_password, user["password_hash"]):
        raise AuthError("PASSWORD_POLICY_VIOLATION", "New password must differ from current password.", 400)
    try:
        validate_password(new_password, confirmation)
    except PasswordPolicyError as exc:
        raise AuthError("PASSWORD_POLICY_VIOLATION", str(exc), 400) from exc

    new_token = generate_session_token()
    new_session_hash = hash_token(new_token)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "UPDATE users SET password_hash = ?, password_changed_at = ?, updated_at = ? WHERE id = ?",
                (hash_password(new_password), iso_now(), iso_now(), context.user["id"]),
            )
            connection.execute(
                """
                UPDATE sessions
                SET status = 'REVOKED', revoked_at = ?, revocation_reason = 'password_changed'
                WHERE user_id = ? AND id != ? AND status = 'ACTIVE'
                """,
                (iso_now(), context.user["id"], context.session["id"]),
            )
            connection.execute(
                "UPDATE sessions SET token_hash = ?, last_seen_at = ? WHERE id = ?",
                (new_session_hash, iso_now(), context.session["id"]),
            )
    record_audit_event(
        database_path,
        "AUTH_PASSWORD_CHANGED",
        "USER",
        "SUCCEEDED",
        request_id,
        actor_id=context.user["id"],
        session_id=context.session["id"],
    )
    record_audit_event(
        database_path,
        "AUTH_SESSIONS_REVOKED_AFTER_PASSWORD_CHANGE",
        "USER",
        "SUCCEEDED",
        request_id,
        actor_id=context.user["id"],
        session_id=context.session["id"],
    )
    return new_token


def get_settings(database_path: Path, context: AuthenticatedContext) -> dict[str, Any]:
    with closing(connect(database_path)) as connection:
        row = connection.execute(
            "SELECT user_id, timezone, locale, display_density, created_at, updated_at FROM user_settings WHERE user_id = ?",
            (context.user["id"],),
        ).fetchone()
    return dict(row)


def update_settings(
    database_path: Path,
    context: AuthenticatedContext,
    payload: dict[str, Any],
    request_id: str,
) -> dict[str, Any]:
    allowed_density = {"comfortable", "compact"}
    timezone = str(payload.get("timezone", context.user["timezone"])).strip() or "UTC"
    locale = str(payload.get("locale", context.user["locale"])).strip() or "en-US"
    display_density = str(payload.get("display_density", "comfortable")).strip()
    if display_density not in allowed_density:
        raise AuthError("VALIDATION_ERROR", "Display density must be comfortable or compact.", 400)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                """
                UPDATE user_settings
                SET timezone = ?, locale = ?, display_density = ?, updated_at = ?
                WHERE user_id = ?
                """,
                (timezone, locale, display_density, iso_now(), context.user["id"]),
            )
            connection.execute(
                "UPDATE users SET timezone = ?, locale = ?, updated_at = ? WHERE id = ?",
                (timezone, locale, iso_now(), context.user["id"]),
            )
    record_audit_event(
        database_path,
        "USER_SETTINGS_UPDATED",
        "USER",
        "SUCCEEDED",
        request_id,
        actor_id=context.user["id"],
        session_id=context.session["id"],
        metadata={"changed_fields": ["timezone", "locale", "display_density"]},
    )
    return get_settings(database_path, context)


def update_profile(
    database_path: Path,
    context: AuthenticatedContext,
    payload: dict[str, Any],
    request_id: str,
) -> dict[str, Any]:
    display_name = str(payload.get("display_name", context.user["display_name"])).strip()
    if not display_name:
        raise AuthError("VALIDATION_ERROR", "Display name is required.", 400)
    with closing(connect(database_path)) as connection:
        with connection:
            connection.execute(
                "UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?",
                (display_name, iso_now(), context.user["id"]),
            )
            row = connection.execute("SELECT * FROM users WHERE id = ?", (context.user["id"],)).fetchone()
    record_audit_event(
        database_path,
        "USER_PROFILE_UPDATED",
        "USER",
        "SUCCEEDED",
        request_id,
        actor_id=context.user["id"],
        session_id=context.session["id"],
        metadata={"changed_fields": ["display_name"]},
    )
    return public_user(row)


def make_session_cookie(token: str, max_age_seconds: int = STANDARD_SESSION_HOURS * 3600) -> str:
    cookie = SimpleCookie()
    cookie[SESSION_COOKIE_NAME] = token
    cookie[SESSION_COOKIE_NAME]["httponly"] = True
    cookie[SESSION_COOKIE_NAME]["samesite"] = "Lax"
    cookie[SESSION_COOKIE_NAME]["path"] = "/"
    cookie[SESSION_COOKIE_NAME]["max-age"] = str(max_age_seconds)
    return cookie.output(header="").strip()


def clear_session_cookie() -> str:
    cookie = SimpleCookie()
    cookie[SESSION_COOKIE_NAME] = ""
    cookie[SESSION_COOKIE_NAME]["httponly"] = True
    cookie[SESSION_COOKIE_NAME]["samesite"] = "Lax"
    cookie[SESSION_COOKIE_NAME]["path"] = "/"
    cookie[SESSION_COOKIE_NAME]["max-age"] = "0"
    return cookie.output(header="").strip()


def extract_session_token(cookie_header: str | None) -> str | None:
    if not cookie_header:
        return None
    cookie = SimpleCookie(cookie_header)
    morsel = cookie.get(SESSION_COOKIE_NAME)
    return morsel.value if morsel else None


def summarize_user_agent(user_agent: str | None) -> str:
    if not user_agent:
        return "Unknown browser"
    return user_agent[:120]


def _find_user(database_path: Path, identifier: str) -> Any | None:
    with closing(connect(database_path)) as connection:
        return connection.execute(
            "SELECT * FROM users WHERE lower(email) = lower(?)",
            (identifier.strip(),),
        ).fetchone()


def _record_failed_login(database_path: Path, user_id: str) -> None:
    with closing(connect(database_path)) as connection:
        with connection:
            user = connection.execute("SELECT failed_login_count FROM users WHERE id = ?", (user_id,)).fetchone()
            failed_count = int(user["failed_login_count"]) + 1
            locked_until = None
            if failed_count >= LOCKOUT_FAILED_ATTEMPTS:
                locked_until = (utc_now() + timedelta(minutes=LOCKOUT_MINUTES)).replace(microsecond=0).isoformat()
            connection.execute(
                "UPDATE users SET failed_login_count = ?, locked_until = ?, updated_at = ? WHERE id = ?",
                (failed_count, locked_until, iso_now(), user_id),
            )
