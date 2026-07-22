from __future__ import annotations

import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from day_to_day_assistant_api import calendar as cal
from day_to_day_assistant_api import notes
from day_to_day_assistant_api.auth import AuthError, authenticate, create_account, make_session_cookie, validate_session
from day_to_day_assistant_api.database import migrate
from day_to_day_assistant_api.productivity import create_task
from day_to_day_assistant_api.server import ROOT


class NotesTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp.name) / "notes.sqlite3"
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

    def test_default_notebook_and_note_lifecycle(self) -> None:
        notebooks = notes.list_notebooks(self.database_path, self.context)
        self.assertEqual(len(notebooks), 1)
        self.assertEqual(notebooks[0]["name"], "General")

        note = notes.create_note(
            self.database_path,
            self.context,
            {"title": "Weekly Review", "content_markdown": "# Wins\n\nCaptured progress.", "tags": ["Review"]},
            "note-1",
        )
        self.assertEqual(note["version"], 1)
        self.assertEqual(note["tags"], ["review"])
        self.assertIn("<h1>Wins</h1>", note["content_html"])

        archived = notes.note_action(self.database_path, self.context, note["id"], "archive", "note-2")
        self.assertEqual(archived["status"], "ARCHIVED")
        restored = notes.note_action(self.database_path, self.context, note["id"], "restore", "note-3")
        self.assertEqual(restored["status"], "ACTIVE")

    def test_updates_create_versions_and_restore_creates_new_version(self) -> None:
        note = notes.create_note(self.database_path, self.context, {"title": "Draft", "content_markdown": "alpha"}, "note-1")
        updated = notes.update_note(
            self.database_path,
            self.context,
            note["id"],
            {"title": "Draft", "content_markdown": "alpha beta", "version": note["version"]},
            "note-2",
        )
        self.assertEqual(updated["version"], 2)
        versions = notes.list_versions(self.database_path, self.context, note["id"])
        self.assertEqual([item["version_number"] for item in versions], [2, 1])

        restored = notes.restore_version(self.database_path, self.context, note["id"], {"version_number": 1}, "note-3")
        self.assertEqual(restored["version"], 3)
        self.assertEqual(restored["content_markdown"], "alpha")

        with self.assertRaises(AuthError):
            notes.update_note(self.database_path, self.context, note["id"], {"content_markdown": "stale", "version": 1}, "note-4")

    def test_search_indexes_notes_tags_notebooks_and_attachments(self) -> None:
        notebook = notes.create_notebook(self.database_path, self.context, {"name": "Research"}, "notebook-1")
        note = notes.create_note(
            self.database_path,
            self.context,
            {
                "notebook_id": notebook["id"],
                "title": "Conference Notes",
                "content_markdown": "A deterministic search plan with phrase support.",
                "tags": ["Knowledge", "Search"],
                "is_favorite": True,
            },
            "note-1",
        )
        attachment = notes.add_attachment(
            self.database_path,
            self.context,
            note["id"],
            {"filename": "meeting-agenda.txt", "media_type": "text/plain", "content_text": "agenda"},
            "attachment-1",
        )
        self.assertEqual(attachment["size_bytes"], 6)
        with self.assertRaises(AuthError):
            notes.add_attachment(
                self.database_path,
                self.context,
                note["id"],
                {"filename": "duplicate.txt", "media_type": "text/plain", "content_text": "agenda"},
                "attachment-2",
            )

        note_results = notes.search(self.database_path, self.context, {"q": '"deterministic search"'})
        self.assertEqual(note_results[0]["record_type"], "NOTE")
        tag_results = notes.search(self.database_path, self.context, {"q": "conference", "tag": "knowledge"})
        self.assertEqual(tag_results[0]["record_id"], note["id"])
        attachment_results = notes.search(self.database_path, self.context, {"q": "meeting-agenda"})
        self.assertTrue(any(item["record_type"] == "ATTACHMENT" for item in attachment_results))

    def test_explicit_links_and_backlinks(self) -> None:
        source = notes.create_note(self.database_path, self.context, {"title": "Meeting Notes", "content_markdown": "Prep"}, "note-1")
        target = notes.create_note(self.database_path, self.context, {"title": "Background", "content_markdown": "Context"}, "note-2")
        task = create_task(self.database_path, self.context, {"title": "Draft plan"}, "task-1")
        start = datetime.now(UTC).replace(microsecond=0) + timedelta(hours=1)
        event = cal.create_event(
            self.database_path,
            self.context,
            {"title": "Planning", "start_at": start.isoformat(), "end_at": (start + timedelta(hours=1)).isoformat()},
            "event-1",
        )

        notes.create_link(
            self.database_path,
            self.context,
            source["id"],
            {"target_type": "NOTE", "target_id": target["id"], "relationship_type": "BACKGROUND"},
            "link-1",
        )
        notes.create_link(
            self.database_path,
            self.context,
            source["id"],
            {"target_type": "TASK", "target_id": task["id"], "relationship_type": "OUTCOME"},
            "link-2",
        )
        notes.create_link(
            self.database_path,
            self.context,
            source["id"],
            {"target_type": "EVENT", "target_id": event["id"], "relationship_type": "MEETING_NOTES"},
            "link-3",
        )

        source_links = notes.list_links(self.database_path, self.context, source["id"])
        target_links = notes.list_links(self.database_path, self.context, target["id"])
        self.assertEqual(len(source_links["outbound"]), 3)
        self.assertEqual(len(target_links["backlinks"]), 1)


if __name__ == "__main__":
    unittest.main()
