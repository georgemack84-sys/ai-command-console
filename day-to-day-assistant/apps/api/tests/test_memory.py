from __future__ import annotations

import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from day_to_day_assistant_api import memory, planning
from day_to_day_assistant_api.auth import AuthError, authenticate, create_account, make_session_cookie, validate_session
from day_to_day_assistant_api.database import migrate
from day_to_day_assistant_api.server import ROOT


class MemoryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp.name) / "memory.sqlite3"
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

    def test_memory_creation_versioning_and_retrieval_are_deterministic(self) -> None:
        first = memory.create_memory(
            self.database_path,
            self.context,
            {
                "category": "Preference",
                "title": "Planning style",
                "content": "I prefer concise daily planning by priority.",
                "source_type": "EXPLICIT_PREFERENCE",
            },
            "memory-1",
        )
        second = memory.create_memory(
            self.database_path,
            self.context,
            {
                "category": "Reference",
                "title": "Coffee",
                "content": "I like medium roast coffee.",
            },
            "memory-2",
        )
        context = memory.retrieve_memories(self.database_path, self.context, {"query": "concise planning priority"}, "retrieve-1")
        self.assertEqual(context["memory_ids"][0], first["id"])
        self.assertNotIn(second["id"], context["memory_ids"])
        updated = memory.update_memory(
            self.database_path,
            self.context,
            first["id"],
            {"content": "I prefer concise weekly planning by priority.", "change_reason": "correction"},
            "update-1",
        )
        self.assertEqual(updated["version"], 2)
        self.assertEqual(len(updated["versions"]), 2)

    def test_archived_deleted_and_expired_memories_are_not_retrieved(self) -> None:
        archived = memory.create_memory(self.database_path, self.context, {"category": "Routine", "title": "Morning review", "content": "Review calendar every morning."}, "memory-1")
        deleted = memory.create_memory(self.database_path, self.context, {"category": "Reference", "title": "Project phrase", "content": "Use project codename amber."}, "memory-2")
        expired = memory.create_memory(
            self.database_path,
            self.context,
            {
                "category": "Commitment",
                "title": "Temporary errand",
                "content": "Buy stamps today.",
                "valid_until": (datetime.now(UTC) - timedelta(minutes=1)).replace(microsecond=0).isoformat(),
            },
            "memory-3",
        )
        memory.memory_action(self.database_path, self.context, archived["id"], "archive", "archive-1")
        memory.delete_memory(self.database_path, self.context, deleted["id"], "delete-1")
        context = memory.retrieve_memories(self.database_path, self.context, {"query": "morning amber stamps"}, "retrieve-1")
        self.assertNotIn(archived["id"], context["memory_ids"])
        self.assertNotIn(deleted["id"], context["memory_ids"])
        self.assertNotIn(expired["id"], context["memory_ids"])
        self.assertEqual(memory.get_memory(self.database_path, self.context, expired["id"])["status"], "EXPIRED")

    def test_sensitive_memory_requires_strong_confirmation_and_privacy_controls_apply(self) -> None:
        with self.assertRaises(AuthError):
            memory.create_memory(self.database_path, self.context, {"category": "Reference", "title": "Sensitive", "content": "Private detail", "sensitivity": "SENSITIVE"}, "memory-1")
        stored = memory.create_memory(
            self.database_path,
            self.context,
            {"category": "Reference", "title": "Sensitive", "content": "Private detail", "sensitivity": "SENSITIVE", "confirmation_text": "REMEMBER"},
            "memory-2",
        )
        self.assertEqual(stored["sensitivity"], "SENSITIVE")
        memory.update_privacy_settings(self.database_path, self.context, {"memory_enabled": True, "personalization_enabled": True, "disabled_categories": ["Reference"]}, "privacy-1")
        with self.assertRaises(AuthError):
            memory.create_memory(self.database_path, self.context, {"category": "Reference", "title": "Blocked", "content": "Nope"}, "memory-3")

    def test_memory_proposal_decisions_routines_and_outcomes(self) -> None:
        proposal = memory.create_memory_proposal(
            self.database_path,
            self.context,
            {"category": "Routine", "title": "Weekly review", "content": "Review tasks on Fridays.", "reason": "Repeated planning pattern."},
            "proposal-1",
        )
        decided = memory.decide_memory_proposal(self.database_path, self.context, proposal["id"], "REMEMBER", "decision-1")
        self.assertEqual(decided["status"], "REMEMBERED")
        self.assertTrue(decided["created_memory_id"])
        routine = memory.create_routine(self.database_path, self.context, {"name": "Weekly Review", "cadence": "WEEKLY", "source_memory_id": decided["created_memory_id"]}, "routine-1")
        outcome = memory.create_outcome(
            self.database_path,
            self.context,
            {"recommendation": "Do a weekly review", "accepted": True, "completed": True, "satisfaction": 5},
            "outcome-1",
        )
        self.assertEqual(routine["status"], "PROPOSED")
        self.assertTrue(outcome["accepted"])
        self.assertTrue(outcome["completed"])

    def test_explicit_preferences_override_learned_personalization(self) -> None:
        memory.upsert_preference(self.database_path, self.context, {"key": "writing_style", "value": "expansive", "source": "LEARNED", "confidence": 0.5}, "pref-1")
        memory.upsert_preference(self.database_path, self.context, {"key": "writing_style", "value": "concise", "source": "EXPLICIT"}, "pref-2")
        preferences = memory.get_preferences(self.database_path, self.context)
        personalized = memory.personalize(self.database_path, self.context, {"query": "planning"}, "personalize-1")
        self.assertEqual(preferences["effective"]["writing_style"], "concise")
        self.assertEqual(preferences["effective"]["timezone"], "UTC")
        self.assertTrue(any(item["value"] == "concise" for item in personalized["personalization"]["adjustments"]))

    def test_planning_context_can_include_relevant_memory(self) -> None:
        memory.create_memory(
            self.database_path,
            self.context,
            {"category": "Preference", "title": "Planning style", "content": "I prefer weekly planning with concise priorities."},
            "memory-1",
        )
        result = planning.handle_request(self.database_path, self.context, {"message": "Help with concise weekly planning"}, "plan-1")
        self.assertIn("memory", result["context_package"]["sources"])
        self.assertTrue(any(record.get("record_type") == "MEMORY" for record in result["context_package"]["retrieved_records"]))


if __name__ == "__main__":
    unittest.main()
