from __future__ import annotations

import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from day_to_day_assistant_api import calendar as cal
from day_to_day_assistant_api import notes, planning
from day_to_day_assistant_api.auth import authenticate, create_account, make_session_cookie, validate_session
from day_to_day_assistant_api.database import migrate
from day_to_day_assistant_api.productivity import create_followup, create_reminder, create_task
from day_to_day_assistant_api.server import ROOT


class PlanningTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp.name) / "planning.sqlite3"
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
        _, token = authenticate(
            self.database_path,
            "user@example.com",
            "correct horse battery staple",
            False,
            "login",
            "UnitTest",
            "127.0.0.1",
        )
        self.context = validate_session(self.database_path, make_session_cookie(token), "session")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_intent_entities_and_tool_selection_are_deterministic(self) -> None:
        intent = planning.classify_intent("What should I work on today?")
        entities = planning.extract_entities("What should I work on today?")
        tools = planning.select_tools(intent, entities, "What should I work on today?")
        self.assertEqual(intent["category"], "RECOMMEND")
        self.assertTrue(any(item["type"] == "DATE" for item in entities))
        self.assertEqual(tools, ["today.summary", "task.search", "calendar.search"])

    def test_request_builds_context_plan_metrics_and_preserves_state(self) -> None:
        create_task(self.database_path, self.context, {"title": "Finish report", "priority": "HIGH"}, "task-1")
        create_followup(self.database_path, self.context, {"title": "Vendor reply", "responsible_party": "Vendor"}, "followup-1")
        create_reminder(
            self.database_path,
            self.context,
            {"title": "Stretch", "scheduled_at": (datetime.now(UTC) + timedelta(hours=1)).replace(microsecond=0).isoformat()},
            "rem-1",
        )
        cal.create_event(
            self.database_path,
            self.context,
            {
                "title": "Planning meeting",
                "start_at": (datetime.now(UTC) + timedelta(hours=2)).replace(microsecond=0).isoformat(),
                "end_at": (datetime.now(UTC) + timedelta(hours=3)).replace(microsecond=0).isoformat(),
            },
            "event-1",
        )
        result = planning.handle_request(self.database_path, self.context, {"message": "What should I work on today?"}, "plan-1")
        self.assertEqual(result["request"]["status"], "RESPONDED")
        self.assertFalse(result["plan"]["requires_confirmation"])
        self.assertIn("today.summary", result["plan"]["required_tools"])
        self.assertGreaterEqual(len(result["context_package"]["retrieved_records"]), 1)
        metrics = planning.list_planning_metrics(self.database_path, self.context)
        self.assertEqual(metrics[0]["status"], "SUCCEEDED")

    def test_note_search_request_uses_note_tool_and_citations(self) -> None:
        notes.create_note(
            self.database_path,
            self.context,
            {"title": "Meeting notes", "content_markdown": "Project Alpha agenda and decisions."},
            "note-1",
        )
        result = planning.handle_request(self.database_path, self.context, {"message": "Find my meeting notes"}, "plan-1")
        self.assertEqual(result["intent"]["category"], "NOTE_REQUEST")
        self.assertIn("note.search", result["plan"]["required_tools"])
        self.assertTrue(result["answer"]["citations"])

    def test_registry_plan_and_context_are_inspectable(self) -> None:
        result = planning.handle_request(self.database_path, self.context, {"message": "Help"}, "plan-1")
        tools = planning.list_tools(self.database_path, self.context)
        self.assertTrue(any(tool["read_only"] for tool in tools))
        self.assertTrue(any(not tool["read_only"] for tool in tools))
        plan = planning.get_plan(self.database_path, self.context, result["plan"]["id"])
        package = planning.get_context_package(self.database_path, self.context, result["context_package"]["id"])
        self.assertEqual(plan["id"], result["plan"]["id"])
        self.assertEqual(package["id"], result["context_package"]["id"])


if __name__ == "__main__":
    unittest.main()
