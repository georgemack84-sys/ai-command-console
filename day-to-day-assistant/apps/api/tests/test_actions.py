from __future__ import annotations

import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from day_to_day_assistant_api import actions, calendar as cal, notes
from day_to_day_assistant_api.auth import AuthError, authenticate, create_account, make_session_cookie, validate_session
from day_to_day_assistant_api.database import migrate
from day_to_day_assistant_api.productivity import create_task, list_tasks
from day_to_day_assistant_api.server import ROOT


class ActionGatewayTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp.name) / "actions.sqlite3"
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

    def test_create_proposal_does_not_mutate_state_before_execution(self) -> None:
        proposal = actions.create_proposal(
            self.database_path,
            self.context,
            {"tool_name": "task.create", "input_payload": {"title": "Renew passport"}},
            "proposal-1",
        )
        self.assertEqual(proposal["status"], "AWAITING_CONFIRMATION")
        self.assertEqual(list_tasks(self.database_path, self.context), [])

    def test_approval_requires_confirmation_text_and_issues_token(self) -> None:
        proposal = actions.create_proposal(
            self.database_path,
            self.context,
            {"tool_name": "task.create", "input_payload": {"title": "Book hotel"}},
            "proposal-1",
        )
        with self.assertRaises(AuthError):
            actions.approve_proposal(self.database_path, self.context, proposal["id"], {"confirmation_text": "yes"}, "approve-1")
        approval = actions.approve_proposal(
            self.database_path,
            self.context,
            proposal["id"],
            {"confirmation_text": "APPROVE"},
            "approve-2",
        )
        self.assertEqual(approval["proposal"]["status"], "APPROVED")
        self.assertTrue(approval["action_token"])

    def test_reject_proposal_prevents_execution_and_changes_nothing(self) -> None:
        proposal = actions.create_proposal(
            self.database_path,
            self.context,
            {"tool_name": "task.create", "input_payload": {"title": "Rejected task"}},
            "proposal-1",
        )
        rejected = actions.reject_proposal(self.database_path, self.context, proposal["id"], {"note": "No"}, "reject-1")
        self.assertEqual(rejected["status"], "REJECTED")
        with self.assertRaises(AuthError):
            actions.execute(
                self.database_path,
                self.context,
                {"proposal_id": proposal["id"], "action_token": "unused"},
                "execute-1",
            )
        self.assertEqual(list_tasks(self.database_path, self.context), [])

    def test_approved_task_create_executes_verifies_and_is_idempotent(self) -> None:
        proposal = actions.create_proposal(
            self.database_path,
            self.context,
            {"tool_name": "task.create", "input_payload": {"title": "Buy stamps", "priority": "LOW"}},
            "proposal-1",
        )
        approval = actions.approve_proposal(
            self.database_path,
            self.context,
            proposal["id"],
            {"confirmation_text": "APPROVE"},
            "approve-1",
        )
        execution = actions.execute(
            self.database_path,
            self.context,
            {"proposal_id": proposal["id"], "action_token": approval["action_token"]},
            "execute-1",
        )
        replay = actions.execute(
            self.database_path,
            self.context,
            {"proposal_id": proposal["id"], "action_token": "already-used"},
            "execute-2",
        )
        self.assertEqual(execution["status"], "VERIFIED")
        self.assertEqual(execution["verification_status"], "VERIFIED")
        self.assertTrue(replay["idempotent_replay"])
        self.assertEqual(len(list_tasks(self.database_path, self.context)), 1)

    def test_expired_proposal_cannot_be_approved(self) -> None:
        proposal = actions.create_proposal(
            self.database_path,
            self.context,
            {
                "tool_name": "task.create",
                "input_payload": {"title": "Too late"},
                "expires_at": (datetime.now(UTC) - timedelta(minutes=1)).replace(microsecond=0).isoformat(),
            },
            "proposal-1",
        )
        with self.assertRaises(AuthError):
            actions.approve_proposal(
                self.database_path,
                self.context,
                proposal["id"],
                {"confirmation_text": "APPROVE"},
                "approve-1",
            )
        self.assertEqual(actions.get_proposal(self.database_path, self.context, proposal["id"])["status"], "EXPIRED")

    def test_supported_task_creation_rollback_records_history(self) -> None:
        proposal = actions.create_proposal(
            self.database_path,
            self.context,
            {"tool_name": "task.create", "input_payload": {"title": "Temporary task"}},
            "proposal-1",
        )
        approval = actions.approve_proposal(
            self.database_path,
            self.context,
            proposal["id"],
            {"confirmation_text": "APPROVE"},
            "approve-1",
        )
        execution = actions.execute(
            self.database_path,
            self.context,
            {"proposal_id": proposal["id"], "action_token": approval["action_token"]},
            "execute-1",
        )
        rolled_back = actions.rollback(self.database_path, self.context, execution["id"], "rollback-1")
        self.assertEqual(rolled_back["status"], "ROLLED_BACK")
        self.assertEqual(list_tasks(self.database_path, self.context), [])

    def test_initial_write_tool_integrations_verify(self) -> None:
        note_proposal = actions.create_proposal(
            self.database_path,
            self.context,
            {"tool_name": "note.create", "input_payload": {"title": "Reference", "content_markdown": "Phase 8"}},
            "note-proposal",
        )
        note_approval = actions.approve_proposal(
            self.database_path,
            self.context,
            note_proposal["id"],
            {"confirmation_text": "APPROVE"},
            "note-approve",
        )
        note_execution = actions.execute(
            self.database_path,
            self.context,
            {"proposal_id": note_proposal["id"], "action_token": note_approval["action_token"]},
            "note-execute",
        )
        self.assertEqual(note_execution["status"], "VERIFIED")

        event_start = (datetime.now(UTC) + timedelta(hours=2)).replace(microsecond=0)
        event_proposal = actions.create_proposal(
            self.database_path,
            self.context,
            {
                "tool_name": "calendar.event.create",
                "input_payload": {
                    "title": "Dentist",
                    "start_at": event_start.isoformat(),
                    "end_at": (event_start + timedelta(hours=1)).isoformat(),
                },
            },
            "event-proposal",
        )
        event_approval = actions.approve_proposal(
            self.database_path,
            self.context,
            event_proposal["id"],
            {"confirmation_text": "APPROVE"},
            "event-approve",
        )
        event_execution = actions.execute(
            self.database_path,
            self.context,
            {"proposal_id": event_proposal["id"], "action_token": event_approval["action_token"]},
            "event-execute",
        )
        self.assertEqual(event_execution["status"], "VERIFIED")
        self.assertTrue(notes.list_notes(self.database_path, self.context))
        self.assertTrue(cal.list_events(self.database_path, self.context))

        cancel_proposal = actions.create_proposal(
            self.database_path,
            self.context,
            {"tool_name": "calendar.event.cancel", "input_payload": {"event_id": event_execution["output_payload"]["event"]["id"]}},
            "cancel-proposal",
        )
        cancel_approval = actions.approve_proposal(
            self.database_path,
            self.context,
            cancel_proposal["id"],
            {"confirmation_text": "APPROVE"},
            "cancel-approve",
        )
        cancel_execution = actions.execute(
            self.database_path,
            self.context,
            {"proposal_id": cancel_proposal["id"], "action_token": cancel_approval["action_token"]},
            "cancel-execute",
        )
        self.assertEqual(cancel_execution["output_payload"]["event"]["status"], "CANCELLED")

        task = create_task(self.database_path, self.context, {"title": "Finish book"}, "task-1")
        complete_proposal = actions.create_proposal(
            self.database_path,
            self.context,
            {"tool_name": "task.complete", "input_payload": {"task_id": task["id"]}},
            "complete-proposal",
        )
        complete_approval = actions.approve_proposal(
            self.database_path,
            self.context,
            complete_proposal["id"],
            {"confirmation_text": "APPROVE"},
            "complete-approve",
        )
        complete_execution = actions.execute(
            self.database_path,
            self.context,
            {"proposal_id": complete_proposal["id"], "action_token": complete_approval["action_token"]},
            "complete-execute",
        )
        self.assertEqual(complete_execution["output_payload"]["task"]["status"], "COMPLETED")


if __name__ == "__main__":
    unittest.main()
