from __future__ import annotations

import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from day_to_day_assistant_api import calendar as cal
from day_to_day_assistant_api.auth import AuthError, authenticate, create_account, make_session_cookie, validate_session
from day_to_day_assistant_api.database import migrate
from day_to_day_assistant_api.productivity import create_followup, create_task, today
from day_to_day_assistant_api.server import ROOT


class CalendarTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp.name) / "calendar.sqlite3"
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

    def test_default_calendar_and_timed_event_validation(self) -> None:
        calendars = cal.list_calendars(self.database_path, self.context)
        self.assertEqual(len(calendars), 1)
        self.assertTrue(calendars[0]["is_default"])

        start = datetime(2026, 7, 18, 14, 0, tzinfo=UTC)
        event = cal.create_event(
            self.database_path,
            self.context,
            {"title": "Planning", "start_at": start.isoformat(), "end_at": (start + timedelta(hours=1)).isoformat()},
            "event-1",
        )
        self.assertEqual(event["status"], "CONFIRMED")

        with self.assertRaises(AuthError):
            cal.create_event(
                self.database_path,
                self.context,
                {"title": "Invalid", "start_at": start.isoformat(), "end_at": start.isoformat()},
                "event-2",
            )

    def test_all_day_events_use_exclusive_end_dates(self) -> None:
        event = cal.create_event(
            self.database_path,
            self.context,
            {"title": "Trip", "is_all_day": True, "start_date": "2026-07-18", "end_date": "2026-07-20"},
            "event-1",
        )
        self.assertTrue(event["is_all_day"])
        self.assertEqual(event["start_date"], "2026-07-18")
        self.assertEqual(event["end_date"], "2026-07-20")

    def test_conflicts_and_availability_use_blocking_events(self) -> None:
        first_start = datetime(2026, 7, 18, 9, 0, tzinfo=UTC)
        cal.create_event(
            self.database_path,
            self.context,
            {"title": "Focus", "start_at": first_start.isoformat(), "end_at": (first_start + timedelta(hours=1)).isoformat()},
            "event-1",
        )
        cal.create_event(
            self.database_path,
            self.context,
            {"title": "Interview", "start_at": (first_start + timedelta(minutes=30)).isoformat(), "end_at": (first_start + timedelta(hours=2)).isoformat()},
            "event-2",
        )

        query = {"start": first_start.isoformat(), "end": (first_start + timedelta(hours=3)).isoformat()}
        conflicts = cal.conflicts(self.database_path, self.context, query)
        self.assertEqual(len(conflicts), 1)

        availability = cal.availability(self.database_path, self.context, query | {"minimum_minutes": "30"})
        self.assertEqual(len(availability["busy"]), 1)
        self.assertEqual(len(availability["free"]), 1)

    def test_recurrence_expansion_and_occurrence_cancel(self) -> None:
        start = datetime(2026, 7, 18, 10, 0, tzinfo=UTC)
        event = cal.create_event(
            self.database_path,
            self.context,
            {
                "title": "Weekly sync",
                "start_at": start.isoformat(),
                "end_at": (start + timedelta(minutes=30)).isoformat(),
                "recurrence_frequency": "WEEKLY",
            },
            "event-1",
        )
        events = cal.list_events(
            self.database_path,
            self.context,
            {"start": start.isoformat(), "end": (start + timedelta(days=22)).isoformat()},
        )
        occurrence_keys = [item["occurrence_key"] for item in events if item.get("occurrence_key")]
        self.assertEqual(len(occurrence_keys), 4)
        self.assertEqual(len(set(occurrence_keys)), 4)

        cal.occurrence_action(self.database_path, self.context, event["id"], occurrence_keys[1], "cancel", "event-2")
        updated = cal.list_events(
            self.database_path,
            self.context,
            {"start": start.isoformat(), "end": (start + timedelta(days=22)).isoformat()},
        )
        self.assertEqual(len([item for item in updated if item.get("occurrence_key")]), 3)

    def test_preparation_links_reminders_and_today(self) -> None:
        start = datetime.now(UTC).replace(hour=16, minute=0, second=0, microsecond=0)
        event = cal.create_event(
            self.database_path,
            self.context,
            {
                "title": "Client review",
                "start_at": start.isoformat(),
                "end_at": (start + timedelta(hours=1)).isoformat(),
                "reminder_offsets": [15],
            },
            "event-1",
        )
        prep = cal.create_preparation_item(self.database_path, self.context, event["id"], {"title": "Agenda"}, "event-2")
        self.assertEqual(prep["title"], "Agenda")

        task = create_task(self.database_path, self.context, {"title": "Draft notes"}, "task-1")
        followup = create_followup(self.database_path, self.context, {"title": "Await confirmation"}, "followup-1")
        self.assertEqual(cal.link_task(self.database_path, self.context, event["id"], task["id"], "event-3")["task_id"], task["id"])
        self.assertEqual(
            cal.link_followup(self.database_path, self.context, event["id"], followup["id"], "event-4")["followup_id"],
            followup["id"],
        )
        snapshot = today(self.database_path, self.context)
        self.assertEqual(len(snapshot["calendar_events"]), 1)


if __name__ == "__main__":
    unittest.main()
