from __future__ import annotations

import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from day_to_day_assistant_api import automation
from day_to_day_assistant_api.auth import authenticate, create_account, make_session_cookie, validate_session
from day_to_day_assistant_api.database import migrate
from day_to_day_assistant_api.productivity import list_tasks
from day_to_day_assistant_api.server import ROOT


class AutomationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp.name) / "automation.sqlite3"
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

    def test_scheduler_calculates_deterministic_next_runs(self) -> None:
        after = "2026-07-18T08:30:00+00:00"
        daily = automation.compute_next_run({"type": "TIME", "schedule": "Daily", "time": "09:00", "timezone": "UTC"}, self.context, after)
        weekly = automation.compute_next_run({"type": "TIME", "schedule": "Weekly", "day_of_week": 1, "time": "09:00", "timezone": "UTC"}, self.context, after)
        self.assertEqual(daily, "2026-07-18T09:00:00+00:00")
        self.assertEqual(weekly, "2026-07-20T09:00:00+00:00")

    def test_create_from_template_and_lifecycle_controls(self) -> None:
        templates = automation.list_templates(self.database_path)
        created = automation.create_automation(self.database_path, self.context, {"template_id": templates[0]["id"]}, "auto-1")
        self.assertEqual(created["status"], "ACTIVE")
        self.assertTrue(created["workflow"]["steps"])
        paused = automation.automation_action(self.database_path, self.context, created["id"], "pause", "pause-1")
        skipped = automation.run_automation(self.database_path, self.context, created["id"], "run-1")
        resumed = automation.automation_action(self.database_path, self.context, created["id"], "resume", "resume-1")
        self.assertEqual(paused["status"], "PAUSED")
        self.assertEqual(skipped["status"], "SKIPPED")
        self.assertEqual(resumed["status"], "ACTIVE")

    def test_run_now_executes_workflow_and_duplicate_trigger_replays(self) -> None:
        created = automation.create_automation(
            self.database_path,
            self.context,
            {
                "name": "Manual briefing",
                "automation_type": "ROUTINE",
                "trigger": {"type": "MANUAL"},
                "steps": [{"step_type": "READ", "name": "Read today", "configuration": {"source": "today"}}, {"step_type": "NOTIFY", "name": "Notify", "configuration": {"message": "Manual briefing completed."}}],
            },
            "auto-1",
        )
        payload = {"scheduled_for": "manual-1", "trigger_type": "MANUAL"}
        first = automation.run_automation(self.database_path, self.context, created["id"], "run-1", payload)
        replay = automation.run_automation(self.database_path, self.context, created["id"], "run-2", payload)
        self.assertEqual(first["status"], "COMPLETED")
        self.assertTrue(replay["idempotent_replay"])
        self.assertEqual(len(automation.list_executions(self.database_path, self.context)), 1)

    def test_due_scheduler_recovers_and_runs_once(self) -> None:
        past = (datetime.now(UTC) - timedelta(minutes=5)).replace(microsecond=0).isoformat()
        created = automation.create_automation(
            self.database_path,
            self.context,
            {
                "name": "Due run",
                "automation_type": "ROUTINE",
                "trigger": {"type": "DATE", "run_at": past},
                "steps": [{"step_type": "NOTIFY", "name": "Notify", "configuration": {"message": "Due run completed."}}],
            },
            "auto-1",
        )
        first = automation.run_due_automations(self.database_path, self.context, "due-1")
        second = automation.run_due_automations(self.database_path, self.context, "due-2")
        self.assertEqual(first["run_count"], 1)
        self.assertEqual(second["run_count"], 0)
        self.assertEqual(automation.get_automation(self.database_path, self.context, created["id"])["last_run_at"] is not None, True)

    def test_write_step_executes_through_action_gateway(self) -> None:
        created = automation.create_automation(
            self.database_path,
            self.context,
            {
                "name": "Create approved task",
                "automation_type": "WORKFLOW",
                "authority_level": "LOW",
                "trigger": {"type": "MANUAL"},
                "write_scope": ["task.create"],
                "steps": [
                    {
                        "step_type": "CREATE",
                        "name": "Create task",
                        "configuration": {"tool_name": "task.create", "input_payload": {"title": "Automation task"}},
                    }
                ],
            },
            "auto-1",
        )
        execution = automation.run_automation(self.database_path, self.context, created["id"], "run-1", {"scheduled_for": "manual-write", "trigger_type": "MANUAL"})
        self.assertEqual(execution["status"], "COMPLETED")
        self.assertEqual(len(list_tasks(self.database_path, self.context)), 1)
        self.assertTrue(execution["steps"][0]["action_proposal_id"])
        self.assertTrue(execution["steps"][0]["action_execution_id"])


if __name__ == "__main__":
    unittest.main()
