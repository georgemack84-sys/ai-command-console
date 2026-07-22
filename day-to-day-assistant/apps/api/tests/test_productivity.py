from __future__ import annotations

import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from day_to_day_assistant_api.auth import authenticate, create_account, make_session_cookie, validate_session
from day_to_day_assistant_api.database import migrate
from day_to_day_assistant_api.productivity import (
    create_followup,
    create_reminder,
    create_task,
    followup_action,
    list_notifications,
    list_tasks,
    process_due_reminders,
    reminder_action,
    task_history,
    today,
    transition_task,
)
from day_to_day_assistant_api.server import ROOT


class ProductivityTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp.name) / "productivity.sqlite3"
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

    def test_task_lifecycle_and_history(self) -> None:
        task = create_task(self.database_path, self.context, {"title": "Write plan", "priority": "HIGH"}, "task-1")
        self.assertEqual(task["status"], "INBOX")
        transition_task(self.database_path, self.context, task["id"], "PLANNED", "task-1a")
        completed = transition_task(self.database_path, self.context, task["id"], "COMPLETED", "task-2")
        self.assertEqual(completed["status"], "COMPLETED")
        reopened = transition_task(self.database_path, self.context, task["id"], "PLANNED", "task-3")
        self.assertEqual(reopened["status"], "PLANNED")
        history = task_history(self.database_path, self.context, task["id"])
        self.assertGreaterEqual(len(history), 3)

    def test_recurring_task_generates_one_next_occurrence(self) -> None:
        due = (datetime.now(UTC) + timedelta(hours=1)).replace(microsecond=0).isoformat()
        task = create_task(
            self.database_path,
            self.context,
            {"title": "Weekly review", "due_at": due, "status": "PLANNED", "recurrence_frequency": "WEEKLY"},
            "task-1",
        )
        transition_task(self.database_path, self.context, task["id"], "COMPLETED", "task-2")
        transition_task(self.database_path, self.context, task["id"], "PLANNED", "task-3")
        transition_task(self.database_path, self.context, task["id"], "COMPLETED", "task-4")
        tasks = [item for item in list_tasks(self.database_path, self.context, {"include_archived": "true"}) if item["title"] == "Weekly review"]
        self.assertEqual(len(tasks), 2)

    def test_due_reminder_delivers_notification_once_and_snoozes(self) -> None:
        due = (datetime.now(UTC) - timedelta(minutes=1)).replace(microsecond=0).isoformat()
        reminder = create_reminder(self.database_path, self.context, {"title": "Stand up", "scheduled_at": due}, "rem-1")
        self.assertEqual(process_due_reminders(self.database_path, self.context), 1)
        self.assertEqual(process_due_reminders(self.database_path, self.context), 0)
        notifications = list_notifications(self.database_path, self.context)
        self.assertEqual(len(notifications), 1)
        snoozed_until = (datetime.now(UTC) + timedelta(minutes=10)).replace(microsecond=0).isoformat()
        snoozed = reminder_action(
            self.database_path,
            self.context,
            reminder["id"],
            "snooze",
            "rem-2",
            {"snoozed_until": snoozed_until},
        )
        self.assertEqual(snoozed["status"], "SNOOZED")

    def test_followup_resolution_and_today(self) -> None:
        due = (datetime.now(UTC) - timedelta(hours=1)).replace(microsecond=0).isoformat()
        followup = create_followup(
            self.database_path,
            self.context,
            {"title": "Reply from vendor", "responsible_party": "Vendor", "review_at": due, "priority": "HIGH"},
            "fu-1",
        )
        snapshot = today(self.database_path, self.context)
        self.assertEqual(len(snapshot["overdue_followups"]), 1)
        resolved = followup_action(self.database_path, self.context, followup["id"], "resolve", "fu-2")
        self.assertEqual(resolved["status"], "RESOLVED")


if __name__ == "__main__":
    unittest.main()
