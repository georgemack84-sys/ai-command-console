from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from day_to_day_assistant_api import production
from day_to_day_assistant_api.auth import authenticate, create_account, make_session_cookie, validate_session
from day_to_day_assistant_api.config import Settings
from day_to_day_assistant_api.database import migrate
from day_to_day_assistant_api.server import ROOT


class ProductionReadinessTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp.name) / "d2d.sqlite3"
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
        self.settings = Settings(
            application="day-to-day-assistant-api",
            version="1.0.0-test",
            build_time="test",
            commit="test",
            environment="test",
            api_host="127.0.0.1",
            api_port=8010,
            database_path=self.database_path,
            database_url="sqlite",
            postgres_host="127.0.0.1",
            postgres_port=5432,
            postgres_db="day_to_day_assistant",
            postgres_user="d2d",
            log_level="INFO",
            ai_provider="mock",
            require_confirmation=True,
            cors_origins=("http://127.0.0.1:5174",),
        )

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_readiness_and_security_checks_are_recorded(self) -> None:
        readiness = production.run_readiness_checks(self.database_path, self.settings, ROOT, self.context, "ready-1")
        security = production.run_security_checks(self.database_path, self.settings, self.context, "security-1")
        stored = production.latest_checks(self.database_path, self.context)

        self.assertTrue(any(item["check_name"] == "schema_current" for item in readiness))
        self.assertTrue(any(item["check_name"] == "password_hashing" for item in security))
        self.assertGreaterEqual(len(stored), len(readiness) + len(security))
        self.assertFalse(any(item["status"] == "FAIL" for item in readiness + security))

    def test_backup_verify_and_restore_rehearsal(self) -> None:
        backup = production.create_backup(self.database_path, self.settings, self.context, {"backup_type": "MANUAL"}, "backup-1")
        verified = production.verify_backup(self.database_path, self.context, backup["id"], "verify-1")
        restore = production.restore_rehearsal(self.database_path, self.settings, self.context, {"backup_id": backup["id"]}, "restore-1")

        self.assertEqual(backup["status"], "CREATED")
        self.assertTrue(Path(backup["file_path"]).exists())
        self.assertEqual(verified["status"], "VERIFIED")
        self.assertTrue(verified["validation"]["valid"])
        self.assertEqual(restore["status"], "STAGED")
        self.assertTrue(Path(restore["target_path"]).exists())

    def test_diagnostics_excludes_secret_tables_and_release_qualifies(self) -> None:
        production.create_backup(self.database_path, self.settings, self.context, {"backup_type": "FULL"}, "backup-1")
        diagnostics = production.diagnostics(self.settings, ROOT, self.context)
        release = production.qualify_release(self.database_path, self.settings, ROOT, self.context, {"tests_passed": True}, "release-1")

        self.assertNotIn("sessions", diagnostics["table_counts"])
        self.assertNotIn("connector_authorizations", diagnostics["table_counts"])
        self.assertIn(release["result"], {"QUALIFIED", "CONDITIONALLY_QUALIFIED"})
        self.assertTrue(release["checklist"]["backup_engine_complete"])


if __name__ == "__main__":
    unittest.main()
