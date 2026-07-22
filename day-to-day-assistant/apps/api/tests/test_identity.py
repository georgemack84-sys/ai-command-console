from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path

from day_to_day_assistant_api.audit import list_audit_events, redact_metadata
from day_to_day_assistant_api.auth import (
    AuthError,
    authenticate,
    change_password,
    create_account,
    make_session_cookie,
    setup_required,
    validate_session,
)
from day_to_day_assistant_api.database import migrate
from day_to_day_assistant_api.security import hash_password, verify_password
from day_to_day_assistant_api.server import ROOT


class IdentityTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp.name) / "identity.sqlite3"
        migrate(self.database_path, ROOT / "apps" / "api" / "migrations")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def account_payload(self, password: str = "correct horse battery staple") -> dict[str, str]:
        return {
            "email": "user@example.com",
            "display_name": "Local User",
            "password": password,
            "password_confirmation": password,
            "timezone": "America/New_York",
            "locale": "en-US",
        }

    def test_password_hash_verifies_without_plaintext(self) -> None:
        encoded = hash_password("correct horse battery staple")
        self.assertNotIn("correct horse", encoded)
        self.assertTrue(verify_password("correct horse battery staple", encoded))
        self.assertFalse(verify_password("wrong horse battery staple", encoded))

    def test_setup_creates_one_active_account_and_audits(self) -> None:
        self.assertTrue(setup_required(self.database_path))
        user = create_account(self.database_path, self.account_payload(), "request-1")
        self.assertEqual(user["email"], "user@example.com")
        self.assertFalse(setup_required(self.database_path))
        with self.assertRaises(AuthError):
            create_account(self.database_path, self.account_payload(), "request-2")
        events = list_audit_events(self.database_path)
        self.assertTrue(any(event["event_type"] == "AUTH_ACCOUNT_CREATED" for event in events))

    def test_login_creates_valid_session_cookie(self) -> None:
        create_account(self.database_path, self.account_payload(), "request-1")
        response, token = authenticate(
            self.database_path,
            "user@example.com",
            "correct horse battery staple",
            False,
            "request-2",
            "UnitTest",
            "127.0.0.1",
        )
        self.assertIn("expires_at", response["session"])
        context = validate_session(self.database_path, make_session_cookie(token), "request-3")
        self.assertEqual(context.user["email"], "user@example.com")

    def test_invalid_login_is_generic_and_audited(self) -> None:
        create_account(self.database_path, self.account_payload(), "request-1")
        with self.assertRaises(AuthError) as error:
            authenticate(
                self.database_path,
                "user@example.com",
                "incorrect password",
                False,
                "request-2",
                "UnitTest",
                "127.0.0.1",
            )
        self.assertEqual(str(error.exception), "The email or password is incorrect.")
        events = list_audit_events(self.database_path)
        self.assertTrue(any(event["event_type"] == "AUTH_LOGIN_FAILED" for event in events))

    def test_password_change_rotates_current_token_and_revokes_others(self) -> None:
        create_account(self.database_path, self.account_payload(), "request-1")
        _, token_a = authenticate(
            self.database_path,
            "user@example.com",
            "correct horse battery staple",
            False,
            "request-2",
            "UnitTest A",
            "127.0.0.1",
        )
        _, token_b = authenticate(
            self.database_path,
            "user@example.com",
            "correct horse battery staple",
            False,
            "request-3",
            "UnitTest B",
            "127.0.0.1",
        )
        context = validate_session(self.database_path, make_session_cookie(token_a), "request-4")
        new_token = change_password(
            self.database_path,
            context,
            {
                "current_password": "correct horse battery staple",
                "new_password": "new correct horse battery staple",
                "new_password_confirmation": "new correct horse battery staple",
            },
            "request-5",
        )
        self.assertEqual(
            validate_session(self.database_path, make_session_cookie(new_token), "request-6").user["email"],
            "user@example.com",
        )
        with self.assertRaises(AuthError):
            validate_session(self.database_path, make_session_cookie(token_b), "request-7")

    def test_audit_metadata_redacts_secrets(self) -> None:
        redacted = redact_metadata({"password": "secret", "session_token": "abc", "route": "/login"})
        self.assertEqual(redacted["password"], "[REDACTED]")
        self.assertEqual(redacted["session_token"], "[REDACTED]")
        self.assertEqual(redacted["route"], "/login")


if __name__ == "__main__":
    unittest.main()
