from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from day_to_day_assistant_api import connectors
from day_to_day_assistant_api.auth import AuthError, authenticate, create_account, make_session_cookie, validate_session
from day_to_day_assistant_api.database import connect, migrate
from day_to_day_assistant_api.server import ROOT


class ConnectorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp.name) / "connectors.sqlite3"
        migrate(self.database_path, ROOT / "apps" / "api" / "migrations")
        create_account(
            self.database_path,
            {
                "email": "user@example.com",
                "display_name": "Local User",
                "password": "correct horse battery staple",
                "password_confirmation": "correct horse battery staple",
                "timezone": "UTC",
                "locale": "en-US",
            },
            "setup",
        )
        _, token = authenticate(self.database_path, "user@example.com", "correct horse battery staple", False, "login", "UnitTest", "127.0.0.1")
        self.context = validate_session(self.database_path, make_session_cookie(token), "session")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_registry_connector_lifecycle_and_scope_validation(self) -> None:
        registry = connectors.list_registry(self.database_path)
        self.assertEqual(len(registry), 4)
        email = connectors.create_connector(
            self.database_path,
            self.context,
            {"provider": "local-email", "connector_type": "EMAIL", "requested_scopes": ["READ", "SYNC"]},
            "connector-1",
        )
        self.assertEqual(email["status"], "DISCONNECTED")
        self.assertEqual(email["requested_scopes"], ["READ", "SYNC"])
        with self.assertRaises(AuthError):
            connectors.create_connector(
                self.database_path,
                self.context,
                {"provider": "local-email", "connector_type": "EMAIL", "requested_scopes": ["DELETE"]},
                "connector-2",
            )

    def test_authorization_refresh_disconnect_and_secret_redaction(self) -> None:
        connector = connectors.create_connector(self.database_path, self.context, {"provider": "local-calendar", "connector_type": "CALENDAR"}, "connector-1")
        authorized = connectors.authorize_connector(self.database_path, self.context, connector["id"], {"scopes": ["READ", "SYNC"]}, "auth-1")
        self.assertEqual(authorized["authorization_state"], "AUTHORIZED")
        self.assertTrue(authorized["authorization"]["secrets_stored"])
        self.assertNotIn("access_token_ciphertext", authorized["authorization"])
        refreshed = connectors.refresh_authorization(self.database_path, self.context, connector["id"], "refresh-1")
        self.assertEqual(refreshed["authorization"]["refresh_status"], "REFRESHED")
        disconnected = connectors.disconnect_connector(self.database_path, self.context, connector["id"], "disconnect-1")
        self.assertEqual(disconnected["status"], "DISCONNECTED")
        self.assertEqual(disconnected["authorization_state"], "REVOKED")

    def test_synchronize_imports_metadata_and_is_idempotent(self) -> None:
        connector = connectors.create_connector(self.database_path, self.context, {"provider": "local-contacts", "connector_type": "CONTACTS"}, "connector-1")
        connectors.authorize_connector(self.database_path, self.context, connector["id"], {}, "auth-1")
        sync = connectors.synchronize(self.database_path, self.context, connector["id"], {"mode": "IMPORT_ONLY", "idempotency_key": "contacts-sync"}, "sync-1")
        replay = connectors.synchronize(self.database_path, self.context, connector["id"], {"mode": "IMPORT_ONLY", "idempotency_key": "contacts-sync"}, "sync-2")
        records = connectors.list_external_records(self.database_path, self.context)
        self.assertEqual(sync["status"], "COMPLETED")
        self.assertTrue(replay["idempotent_replay"])
        self.assertEqual(sync["imported_count"], 1)
        self.assertEqual(records[0]["record_type"], "CONTACTS")

    def test_expired_authorization_health_degrades_and_refresh_recovers(self) -> None:
        connector = connectors.create_connector(self.database_path, self.context, {"provider": "local-storage", "connector_type": "STORAGE"}, "connector-1")
        connectors.authorize_connector(self.database_path, self.context, connector["id"], {"expires_in_hours": -1}, "auth-1")
        checked = connectors.health_check(self.database_path, self.context, connector["id"], "health-1")
        self.assertEqual(checked["authorization_state"], "EXPIRED")
        with self.assertRaises(AuthError):
            connectors.synchronize(self.database_path, self.context, connector["id"], {"mode": "IMPORT_ONLY"}, "sync-1")
        refreshed = connectors.refresh_authorization(self.database_path, self.context, connector["id"], "refresh-1")
        self.assertEqual(refreshed["status"], "CONNECTED")

    def test_conflict_detection_and_resolution(self) -> None:
        connector = connectors.create_connector(self.database_path, self.context, {"provider": "local-email", "connector_type": "EMAIL"}, "connector-1")
        connectors.authorize_connector(self.database_path, self.context, connector["id"], {}, "auth-1")
        connectors.synchronize(self.database_path, self.context, connector["id"], {"mode": "IMPORT_ONLY", "idempotency_key": "sync-1"}, "sync-1")
        connection = connect(self.database_path)
        try:
            with connection:
                connection.execute(
                    "UPDATE external_links SET external_checksum = 'stale-checksum' WHERE connector_id = ? AND external_id = 'email-001'",
                    (connector["id"],),
                )
        finally:
            connection.close()
        conflict_sync = connectors.synchronize(self.database_path, self.context, connector["id"], {"mode": "IMPORT_ONLY", "idempotency_key": "sync-2"}, "sync-2")
        conflicts = connectors.list_conflicts(self.database_path, self.context)
        resolved = connectors.resolve_conflict(self.database_path, self.context, conflicts[0]["id"], {"resolution": "MERGE"}, "resolve-1")
        self.assertEqual(conflict_sync["status"], "CONFLICT")
        self.assertEqual(conflict_sync["conflict_count"], 1)
        self.assertEqual(resolved["status"], "RESOLVED")
        self.assertEqual(resolved["resolution"], "MERGE")


if __name__ == "__main__":
    unittest.main()
