from __future__ import annotations

import base64
import hashlib
import hmac
import os
import secrets


PASSWORD_SCHEME = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 600_000
PASSWORD_SALT_BYTES = 16
SESSION_TOKEN_BYTES = 32
MAX_PASSWORD_LENGTH = 256

BLOCKED_PASSWORDS = {
    "passwordpassword",
    "password1234",
    "daytodayassistant",
    "changemechangeme",
    "letmeinletmein",
    "defaultpassword",
}


class PasswordPolicyError(ValueError):
    pass


def validate_password(password: str, confirmation: str | None = None) -> None:
    if confirmation is not None and password != confirmation:
        raise PasswordPolicyError("Password confirmation does not match.")
    if len(password) < 12:
        raise PasswordPolicyError("Password must be at least 12 characters.")
    if len(password) > MAX_PASSWORD_LENGTH:
        raise PasswordPolicyError(f"Password must be at most {MAX_PASSWORD_LENGTH} characters.")
    normalized = password.strip().lower().replace(" ", "")
    if normalized in BLOCKED_PASSWORDS:
        raise PasswordPolicyError("Password is too common.")


def hash_password(password: str) -> str:
    validate_password(password)
    salt = os.urandom(PASSWORD_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return ".".join(
        [
            PASSWORD_SCHEME,
            str(PASSWORD_ITERATIONS),
            base64.urlsafe_b64encode(salt).decode("ascii"),
            base64.urlsafe_b64encode(digest).decode("ascii"),
        ]
    )


def verify_password(password: str, encoded_hash: str) -> bool:
    try:
        scheme, iterations_text, salt_text, digest_text = encoded_hash.split(".", 3)
        if scheme != PASSWORD_SCHEME:
            return False
        salt = base64.urlsafe_b64decode(salt_text.encode("ascii"))
        expected = base64.urlsafe_b64decode(digest_text.encode("ascii"))
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iterations_text))
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def generate_session_token() -> str:
    return secrets.token_urlsafe(SESSION_TOKEN_BYTES)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def hash_identifier(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode("utf-8")).hexdigest()
