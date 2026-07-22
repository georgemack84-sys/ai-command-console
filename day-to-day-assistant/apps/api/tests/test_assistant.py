from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from day_to_day_assistant_api import assistant as asst
from day_to_day_assistant_api.auth import AuthError, authenticate, create_account, make_session_cookie, validate_session
from day_to_day_assistant_api.database import migrate
from day_to_day_assistant_api.server import ROOT


class AssistantTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp.name) / "assistant.sqlite3"
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

    def test_mock_chat_persists_messages_usage_and_prompt_version(self) -> None:
        result = asst.chat(self.database_path, self.context, {"message": "Help me plan the day"}, "chat-1", True)
        conversation = result["conversation"]
        self.assertEqual(len(conversation["messages"]), 2)
        self.assertEqual(conversation["messages"][0]["role"], "USER")
        self.assertEqual(conversation["messages"][1]["role"], "ASSISTANT")
        self.assertEqual(conversation["messages"][1]["provider"], "mock")
        self.assertEqual(conversation["messages"][1]["prompt_version"], asst.DEFAULT_PROMPT_VERSION)
        self.assertTrue(result["stream"]["completed"])
        self.assertGreater(len(result["stream"]["chunks"]), 1)
        usage = asst.list_usage(self.database_path, self.context)
        self.assertEqual(len(usage), 1)
        self.assertEqual(usage[0]["status"], "SUCCEEDED")

    def test_conversation_lifecycle_search_and_export(self) -> None:
        conversation = asst.create_conversation(self.database_path, self.context, {"title": "Planning Thread"}, "conv-1")
        asst.append_message(self.database_path, self.context, conversation["id"], {"role": "USER", "content": "Find agenda topics"}, "msg-1")
        found = asst.search_conversations(self.database_path, self.context, {"q": "agenda"})
        self.assertEqual(found[0]["id"], conversation["id"])
        renamed = asst.update_conversation(self.database_path, self.context, conversation["id"], {"title": "Renamed"}, "conv-2")
        self.assertEqual(renamed["title"], "Renamed")
        exported = asst.export_conversation(self.database_path, self.context, conversation["id"])
        self.assertIn("# Renamed", exported)
        archived = asst.conversation_action(self.database_path, self.context, conversation["id"], "archive", "conv-3")
        self.assertEqual(archived["status"], "ARCHIVED")
        restored = asst.conversation_action(self.database_path, self.context, conversation["id"], "restore", "conv-4")
        self.assertEqual(restored["status"], "ACTIVE")

    def test_provider_settings_health_and_prompt_registry(self) -> None:
        settings = asst.get_settings(self.database_path, self.context)
        self.assertEqual(settings["provider"], "mock")
        updated = asst.update_settings(
            self.database_path,
            self.context,
            {"provider": "local", "model": "local-test", "temperature": 0.2, "max_tokens": 256, "timeout_seconds": 10},
            "settings-1",
        )
        self.assertEqual(updated["provider"], "local")
        health = asst.provider_health(self.database_path, self.context)
        self.assertEqual(health[0]["status"], "UNAVAILABLE")
        prompts = asst.list_prompts(self.database_path, self.context)
        self.assertEqual(prompts[0]["active_version"], asst.DEFAULT_PROMPT_VERSION)

    def test_structured_validation_rejects_side_effects(self) -> None:
        valid = asst.validate_structured_response(
            {
                "schema_name": "assistant.advisory_response",
                "schema_version": "1.0",
                "payload": {"answer": "Read-only answer.", "side_effects": [], "read_only": True},
            }
        )
        self.assertEqual(valid["payload"]["read_only"], True)
        with self.assertRaises(AuthError):
            asst.validate_structured_response(
                {
                    "schema_name": "assistant.advisory_response",
                    "schema_version": "1.0",
                    "payload": {"answer": "I created a task.", "side_effects": ["TASK_CREATED"], "read_only": False},
                }
            )


if __name__ == "__main__":
    unittest.main()
