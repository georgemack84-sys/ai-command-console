from __future__ import annotations

import os
import tempfile
import unittest

from day_to_day_assistant_api.config import ConfigurationError, load_settings
from day_to_day_assistant_api.health import health_payload, version_payload
from day_to_day_assistant_api.server import ROOT


class HealthTests(unittest.TestCase):
    def test_health_payload_reports_ok(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            os.environ["D2D_DATABASE_PATH"] = f"{directory}/test.sqlite3"
            settings = load_settings()
            payload = health_payload(settings, ROOT)
        self.assertEqual(payload["status"], "healthy")
        self.assertEqual(payload["application"], "day-to-day-assistant-api")
        self.assertGreaterEqual(payload["components"]["sqlite_migrations"], 1)

    def test_version_payload_reports_application(self) -> None:
        settings = load_settings()
        payload = version_payload(settings)
        self.assertEqual(payload["application"], "day-to-day-assistant-api")
        self.assertIn("version", payload)

    def test_invalid_port_fails_configuration(self) -> None:
        original = os.environ.get("D2D_API_PORT")
        os.environ["D2D_API_PORT"] = "not-a-port"
        try:
            with self.assertRaises(ConfigurationError):
                load_settings()
        finally:
            if original is None:
                os.environ.pop("D2D_API_PORT", None)
            else:
                os.environ["D2D_API_PORT"] = original


if __name__ == "__main__":
    unittest.main()
