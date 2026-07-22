from __future__ import annotations

import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl
from uuid import uuid4

from day_to_day_assistant_api.audit import get_audit_event, list_audit_events
from day_to_day_assistant_api.auth import (
    AuthError,
    authenticate,
    change_password,
    clear_session_cookie,
    create_account,
    get_settings,
    list_sessions,
    logout,
    make_session_cookie,
    revoke_other_sessions,
    revoke_session,
    setup_required,
    update_profile,
    update_settings,
    validate_session,
)
from day_to_day_assistant_api.config import ConfigurationError, load_settings
from day_to_day_assistant_api.database import migrate
from day_to_day_assistant_api.health import health_payload, version_payload
from day_to_day_assistant_api import actions
from day_to_day_assistant_api import assistant as asst
from day_to_day_assistant_api import automation
from day_to_day_assistant_api import calendar as cal
from day_to_day_assistant_api import connectors
from day_to_day_assistant_api import memory
from day_to_day_assistant_api import notes
from day_to_day_assistant_api import planning
from day_to_day_assistant_api import production
from day_to_day_assistant_api import productivity as prod


ROOT = Path(__file__).resolve().parents[4]


def error_payload(
    code: str,
    message: str,
    request_id: str,
    details: dict[str, Any] | None = None,
    retryable: bool = False,
) -> dict[str, Any]:
    return {
        "code": code,
        "message": message,
        "details": details or {},
        "request_id": request_id,
        "retryable": retryable,
    }


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        request_id = self.headers.get("X-Request-ID", str(uuid4()))
        try:
            settings = load_settings()
            route = self.path.split("?", 1)[0]
            database_path = settings.database_path
            if route in {"/health", "/api/v1/health"}:
                self.respond(HTTPStatus.OK, health_payload(settings, ROOT), request_id)
                return
            if route == "/api/v1/system/health":
                self.respond(HTTPStatus.OK, production.system_health(settings, ROOT), request_id)
                return
            if route == "/api/v1/health/live":
                self.respond(
                    HTTPStatus.OK,
                    {"status": "healthy", "application": settings.application},
                    request_id,
                )
                return
            if route == "/api/v1/health/ready":
                payload = health_payload(settings, ROOT)
                status = HTTPStatus.OK if payload["status"] == "healthy" else HTTPStatus.SERVICE_UNAVAILABLE
                self.respond(status, payload, request_id)
                return
            if route in {"/api/v1/version", "/api/v1/system/version"}:
                self.respond(HTTPStatus.OK, version_payload(settings), request_id)
                return
            if route == "/api/v1/auth/setup-status":
                self.respond(HTTPStatus.OK, {"setup_required": setup_required(database_path)}, request_id)
                return
            if route == "/api/v1/auth/session":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"user": context.user, "session": context.session}, request_id)
                return
            if route == "/api/v1/auth/sessions":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"sessions": list_sessions(database_path, context)}, request_id)
                return
            if route == "/api/v1/users/me":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"user": context.user}, request_id)
                return
            if route == "/api/v1/settings":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"settings": get_settings(database_path, context)}, request_id)
                return
            if route == "/api/v1/audit-events":
                validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"audit_events": list_audit_events(database_path)}, request_id)
                return
            if route.startswith("/api/v1/audit-events/"):
                validate_session(database_path, self.headers.get("Cookie"), request_id)
                event_id = route.rsplit("/", 1)[-1]
                event = get_audit_event(database_path, event_id)
                if event is None:
                    self.respond(
                        HTTPStatus.NOT_FOUND,
                        error_payload("NOT_FOUND", "Audit event not found.", request_id),
                        request_id,
                    )
                    return
                self.respond(HTTPStatus.OK, {"audit_event": event}, request_id)
                return
            context = None
            if route in {
                "/api/v1/calendars",
                "/api/v1/events",
                "/api/v1/events/search",
                "/api/v1/calendar/day",
                "/api/v1/calendar/week",
                "/api/v1/calendar/month",
                "/api/v1/calendar/agenda",
                "/api/v1/calendar/conflicts",
                "/api/v1/notebooks",
                "/api/v1/notes",
                "/api/v1/attachments",
                "/api/v1/tags",
                "/api/v1/search",
                "/api/v1/conversations",
                "/api/v1/conversations/search",
                "/api/v1/prompts",
                "/api/v1/usage",
                "/api/v1/assistant/settings",
                "/api/v1/assistant/provider-health",
                "/api/v1/tools",
                "/api/v1/metrics/planning",
                "/api/v1/proposals",
                "/api/v1/executions",
                "/api/v1/metrics/execution",
                "/api/v1/memories",
                "/api/v1/memory/proposals",
                "/api/v1/memory/privacy",
                "/api/v1/memory/export",
                "/api/v1/preferences",
                "/api/v1/outcomes",
                "/api/v1/routines",
                "/api/v1/automations",
                "/api/v1/automation-templates",
                "/api/v1/automation-executions",
                "/api/v1/scheduler/jobs",
                "/api/v1/connector-registry",
                "/api/v1/connectors",
                "/api/v1/synchronizations",
                "/api/v1/synchronization-conflicts",
                "/api/v1/external-records",
                "/api/v1/connectors/export",
                "/api/v1/system/diagnostics",
                "/api/v1/system/backups",
                "/api/v1/system/restores",
                "/api/v1/system/checks",
                "/api/v1/system/releases",
                "/api/v1/task-lists",
                "/api/v1/projects",
                "/api/v1/tasks",
                "/api/v1/reminders",
                "/api/v1/notifications",
                "/api/v1/followups",
                "/api/v1/today",
                "/api/v1/activity",
            } or route.startswith(("/api/v1/calendars/", "/api/v1/events/", "/api/v1/notebooks/", "/api/v1/notes/", "/api/v1/attachments/", "/api/v1/conversations/", "/api/v1/plans/", "/api/v1/context/", "/api/v1/proposals/", "/api/v1/executions/", "/api/v1/memories/", "/api/v1/memory/proposals/", "/api/v1/automations/", "/api/v1/automation-executions/", "/api/v1/connectors/", "/api/v1/synchronizations/", "/api/v1/synchronization-conflicts/", "/api/v1/system/backups/", "/api/v1/task-lists/", "/api/v1/projects/", "/api/v1/tasks/", "/api/v1/reminders/", "/api/v1/followups/")):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                query = parse_query(self.path)
                if route == "/api/v1/system/diagnostics":
                    self.respond(HTTPStatus.OK, {"diagnostics": production.diagnostics(settings, ROOT, context)}, request_id)
                    return
                if route == "/api/v1/system/backups":
                    self.respond(HTTPStatus.OK, {"backups": production.list_backups(database_path, context)}, request_id)
                    return
                if route == "/api/v1/system/restores":
                    self.respond(HTTPStatus.OK, {"restores": production.list_restores(database_path, context)}, request_id)
                    return
                if route == "/api/v1/system/checks":
                    self.respond(HTTPStatus.OK, {"checks": production.latest_checks(database_path, context, query.get("category"))}, request_id)
                    return
                if route == "/api/v1/system/releases":
                    self.respond(HTTPStatus.OK, {"releases": production.list_releases(database_path, context)}, request_id)
                    return
                if route == "/api/v1/tools":
                    self.respond(HTTPStatus.OK, {"tools": planning.list_tools(database_path, context)}, request_id)
                    return
                if route == "/api/v1/metrics/planning":
                    self.respond(HTTPStatus.OK, {"metrics": planning.list_planning_metrics(database_path, context)}, request_id)
                    return
                if route == "/api/v1/metrics/execution":
                    self.respond(HTTPStatus.OK, {"metrics": actions.list_execution_metrics(database_path, context)}, request_id)
                    return
                if route == "/api/v1/proposals":
                    self.respond(HTTPStatus.OK, {"proposals": actions.list_proposals(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/proposals/"):
                    self.respond(HTTPStatus.OK, {"proposal": actions.get_proposal(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/executions":
                    self.respond(HTTPStatus.OK, {"executions": actions.list_executions(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/executions/"):
                    self.respond(HTTPStatus.OK, {"execution": actions.get_execution(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/memories":
                    self.respond(HTTPStatus.OK, {"memories": memory.list_memories(database_path, context, query)}, request_id)
                    return
                if route.startswith("/api/v1/memories/"):
                    self.respond(HTTPStatus.OK, {"memory": memory.get_memory(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/memory/proposals":
                    self.respond(HTTPStatus.OK, {"proposals": memory.list_memory_proposals(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/memory/proposals/"):
                    self.respond(HTTPStatus.OK, {"proposal": memory.get_memory_proposal(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/memory/privacy":
                    self.respond(HTTPStatus.OK, {"privacy": memory.get_privacy_settings(database_path, context)}, request_id)
                    return
                if route == "/api/v1/memory/export":
                    self.respond(HTTPStatus.OK, {"memory_export": memory.export_memory(database_path, context)}, request_id)
                    return
                if route == "/api/v1/preferences":
                    self.respond(HTTPStatus.OK, {"preferences": memory.get_preferences(database_path, context)}, request_id)
                    return
                if route == "/api/v1/outcomes":
                    self.respond(HTTPStatus.OK, {"outcomes": memory.list_outcomes(database_path, context)}, request_id)
                    return
                if route == "/api/v1/routines":
                    self.respond(HTTPStatus.OK, {"routines": memory.list_routines(database_path, context)}, request_id)
                    return
                if route == "/api/v1/automations":
                    self.respond(HTTPStatus.OK, {"automations": automation.list_automations(database_path, context)}, request_id)
                    return
                if route == "/api/v1/automation-templates":
                    self.respond(HTTPStatus.OK, {"templates": automation.list_templates(database_path)}, request_id)
                    return
                if route == "/api/v1/automation-executions":
                    self.respond(HTTPStatus.OK, {"executions": automation.list_executions(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/automation-executions/"):
                    self.respond(HTTPStatus.OK, {"execution": automation.get_execution(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/scheduler/jobs":
                    self.respond(HTTPStatus.OK, {"jobs": automation.list_scheduler_jobs(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/automations/"):
                    self.respond(HTTPStatus.OK, {"automation": automation.get_automation(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/connector-registry":
                    self.respond(HTTPStatus.OK, {"registry": connectors.list_registry(database_path)}, request_id)
                    return
                if route == "/api/v1/connectors":
                    self.respond(HTTPStatus.OK, {"connectors": connectors.list_connectors(database_path, context)}, request_id)
                    return
                if route == "/api/v1/connectors/export":
                    self.respond(HTTPStatus.OK, {"connector_export": connectors.connector_export(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/connectors/"):
                    self.respond(HTTPStatus.OK, {"connector": connectors.get_connector(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/synchronizations":
                    self.respond(HTTPStatus.OK, {"synchronizations": connectors.list_synchronizations(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/synchronizations/"):
                    self.respond(HTTPStatus.OK, {"synchronization": connectors.get_synchronization(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/synchronization-conflicts":
                    self.respond(HTTPStatus.OK, {"conflicts": connectors.list_conflicts(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/synchronization-conflicts/"):
                    self.respond(HTTPStatus.OK, {"conflict": connectors.get_conflict(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/external-records":
                    self.respond(HTTPStatus.OK, {"records": connectors.list_external_records(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/plans/"):
                    self.respond(HTTPStatus.OK, {"plan": planning.get_plan(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route.startswith("/api/v1/context/"):
                    self.respond(HTTPStatus.OK, {"context_package": planning.get_context_package(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/conversations":
                    self.respond(HTTPStatus.OK, {"conversations": asst.list_conversations(database_path, context, query)}, request_id)
                    return
                if route == "/api/v1/conversations/search":
                    self.respond(HTTPStatus.OK, {"conversations": asst.search_conversations(database_path, context, query)}, request_id)
                    return
                if route == "/api/v1/prompts":
                    self.respond(HTTPStatus.OK, {"prompts": asst.list_prompts(database_path, context)}, request_id)
                    return
                if route == "/api/v1/usage":
                    self.respond(HTTPStatus.OK, {"usage": asst.list_usage(database_path, context)}, request_id)
                    return
                if route == "/api/v1/assistant/settings":
                    self.respond(HTTPStatus.OK, {"settings": asst.get_settings(database_path, context)}, request_id)
                    return
                if route == "/api/v1/assistant/provider-health":
                    self.respond(HTTPStatus.OK, {"provider_health": asst.provider_health(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/conversations/") and route.endswith("/export"):
                    conversation_id = route.split("/")[-2]
                    self.respond(HTTPStatus.OK, {"markdown": asst.export_conversation(database_path, context, conversation_id)}, request_id)
                    return
                if route.startswith("/api/v1/conversations/"):
                    self.respond(HTTPStatus.OK, {"conversation": asst.get_conversation(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/notebooks":
                    self.respond(HTTPStatus.OK, {"notebooks": notes.list_notebooks(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/notebooks/"):
                    self.respond(HTTPStatus.OK, {"notebook": notes.get_notebook(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/notes":
                    self.respond(HTTPStatus.OK, {"notes": notes.list_notes(database_path, context, query)}, request_id)
                    return
                if route == "/api/v1/attachments":
                    self.respond(HTTPStatus.OK, {"attachments": notes.list_attachments(database_path, context)}, request_id)
                    return
                if route == "/api/v1/tags":
                    self.respond(HTTPStatus.OK, {"tags": notes.list_tags(database_path, context)}, request_id)
                    return
                if route == "/api/v1/search":
                    self.respond(HTTPStatus.OK, {"results": notes.search(database_path, context, query)}, request_id)
                    return
                if route.startswith("/api/v1/notes/") and route.endswith("/versions"):
                    note_id = route.split("/")[-2]
                    self.respond(HTTPStatus.OK, {"versions": notes.list_versions(database_path, context, note_id)}, request_id)
                    return
                if route.startswith("/api/v1/notes/") and route.endswith("/attachments"):
                    note_id = route.split("/")[-2]
                    self.respond(HTTPStatus.OK, {"attachments": notes.list_attachments(database_path, context, note_id)}, request_id)
                    return
                if route.startswith("/api/v1/notes/") and route.endswith("/links"):
                    note_id = route.split("/")[-2]
                    self.respond(HTTPStatus.OK, {"links": notes.list_links(database_path, context, note_id)}, request_id)
                    return
                if route.startswith("/api/v1/notes/"):
                    self.respond(HTTPStatus.OK, {"note": notes.get_note(database_path, context, route.rsplit("/", 1)[-1], True)}, request_id)
                    return
                if route.startswith("/api/v1/attachments/"):
                    self.respond(HTTPStatus.OK, {"attachment": notes.get_attachment(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/calendars":
                    self.respond(HTTPStatus.OK, {"calendars": cal.list_calendars(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/calendars/"):
                    self.respond(HTTPStatus.OK, {"calendar": cal.get_calendar(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route in {"/api/v1/events", "/api/v1/calendar/day", "/api/v1/calendar/week", "/api/v1/calendar/month", "/api/v1/calendar/agenda"}:
                    self.respond(HTTPStatus.OK, {"events": cal.list_events(database_path, context, query)}, request_id)
                    return
                if route == "/api/v1/calendar/conflicts":
                    self.respond(HTTPStatus.OK, {"conflicts": cal.conflicts(database_path, context, query)}, request_id)
                    return
                if route == "/api/v1/events/search":
                    self.respond(HTTPStatus.OK, {"events": cal.search_events(database_path, context, query)}, request_id)
                    return
                if route.startswith("/api/v1/events/") and route.endswith("/history"):
                    event_id = route.split("/")[-2]
                    self.respond(HTTPStatus.OK, {"history": cal.event_history(database_path, context, event_id)}, request_id)
                    return
                if route.startswith("/api/v1/events/") and route.endswith("/preparation-items"):
                    event_id = route.split("/")[-2]
                    self.respond(HTTPStatus.OK, {"preparation_items": cal.get_preparation_items(database_path, context, event_id)}, request_id)
                    return
                if route.startswith("/api/v1/events/") and route.endswith("/export"):
                    event_id = route.split("/")[-2]
                    self.respond(HTTPStatus.OK, {"ics": cal.export_event(database_path, context, event_id)}, request_id)
                    return
                if route.startswith("/api/v1/events/"):
                    self.respond(HTTPStatus.OK, {"event": cal.get_event(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/task-lists":
                    self.respond(HTTPStatus.OK, {"task_lists": prod.list_task_lists(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/task-lists/"):
                    self.respond(HTTPStatus.OK, {"task_list": prod.get_task_list(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/projects":
                    self.respond(HTTPStatus.OK, {"projects": prod.list_projects(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/projects/"):
                    self.respond(HTTPStatus.OK, {"project": prod.get_project(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/tasks":
                    self.respond(HTTPStatus.OK, {"tasks": prod.list_tasks(database_path, context, query)}, request_id)
                    return
                if route.startswith("/api/v1/tasks/") and route.endswith("/history"):
                    task_id = route.split("/")[-2]
                    self.respond(HTTPStatus.OK, {"history": prod.task_history(database_path, context, task_id)}, request_id)
                    return
                if route.startswith("/api/v1/tasks/"):
                    self.respond(HTTPStatus.OK, {"task": prod.get_task(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/reminders":
                    self.respond(HTTPStatus.OK, {"reminders": prod.list_reminders(database_path, context)}, request_id)
                    return
                if route.startswith("/api/v1/reminders/") and route.endswith("/deliveries"):
                    reminder_id = route.split("/")[-2]
                    self.respond(HTTPStatus.OK, {"deliveries": prod.reminder_deliveries(database_path, context, reminder_id)}, request_id)
                    return
                if route.startswith("/api/v1/reminders/"):
                    self.respond(HTTPStatus.OK, {"reminder": prod.get_reminder(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/notifications":
                    self.respond(HTTPStatus.OK, {"notifications": prod.list_notifications(database_path, context)}, request_id)
                    return
                if route == "/api/v1/followups":
                    self.respond(HTTPStatus.OK, {"followups": prod.list_followups(database_path, context, query)}, request_id)
                    return
                if route.startswith("/api/v1/followups/") and route.endswith("/history"):
                    followup_id = route.split("/")[-2]
                    self.respond(HTTPStatus.OK, {"history": prod.followup_history(database_path, context, followup_id)}, request_id)
                    return
                if route.startswith("/api/v1/followups/"):
                    self.respond(HTTPStatus.OK, {"followup": prod.get_followup(database_path, context, route.rsplit("/", 1)[-1])}, request_id)
                    return
                if route == "/api/v1/today":
                    self.respond(HTTPStatus.OK, {"today": prod.today(database_path, context)}, request_id)
                    return
                if route == "/api/v1/activity":
                    self.respond(HTTPStatus.OK, {"activity": prod.activity(database_path, context)}, request_id)
                    return
            self.respond(
                HTTPStatus.NOT_FOUND,
                error_payload("NOT_FOUND", "Route not found.", request_id),
                request_id,
            )
        except AuthError as exc:
            self.respond(
                HTTPStatus(exc.status),
                error_payload(exc.code, str(exc), request_id),
                request_id,
                extra_headers=_auth_error_headers(exc),
            )
        except ConfigurationError as exc:
            self.respond(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                error_payload("CONFIGURATION_INVALID", str(exc), request_id),
                request_id,
            )
        except Exception as exc:
            self.respond(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                error_payload(
                    "INTERNAL_ERROR",
                    "The API encountered an unexpected error.",
                    request_id,
                    {"error": exc.__class__.__name__},
                    retryable=True,
                ),
                request_id,
            )

    def do_POST(self) -> None:
        request_id = self.headers.get("X-Request-ID", str(uuid4()))
        try:
            settings = load_settings()
            route = self.path.split("?", 1)[0]
            body = self.read_json()
            database_path = settings.database_path
            if route == "/api/v1/auth/setup":
                user = create_account(database_path, body, request_id)
                self.respond(HTTPStatus.CREATED, {"user": user}, request_id)
                return
            if route == "/api/v1/auth/login":
                payload, token = authenticate(
                    database_path,
                    str(body.get("identifier", "")),
                    str(body.get("password", "")),
                    bool(body.get("remember_session", False)),
                    request_id,
                    self.headers.get("User-Agent"),
                    self.client_address[0],
                )
                self.respond(
                    HTTPStatus.OK,
                    payload,
                    request_id,
                    extra_headers={"Set-Cookie": make_session_cookie(token)},
                )
                return
            if route == "/api/v1/auth/logout":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                logout(database_path, context, request_id)
                self.respond(
                    HTTPStatus.OK,
                    {"status": "signed_out"},
                    request_id,
                    extra_headers={"Set-Cookie": clear_session_cookie()},
                )
                return
            if route == "/api/v1/auth/sessions/revoke-others":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                count = revoke_other_sessions(database_path, context, request_id)
                self.respond(HTTPStatus.OK, {"revoked_count": count}, request_id)
                return
            if route == "/api/v1/auth/password/change":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                token = change_password(database_path, context, body, request_id)
                self.respond(
                    HTTPStatus.OK,
                    {"status": "password_changed"},
                    request_id,
                    extra_headers={"Set-Cookie": make_session_cookie(token)},
                )
                return
            if route in {"/api/v1/system/checks/readiness", "/api/v1/system/readiness"}:
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"checks": production.run_readiness_checks(database_path, settings, ROOT, context, request_id)}, request_id)
                return
            if route in {"/api/v1/system/checks/security", "/api/v1/system/security"}:
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"checks": production.run_security_checks(database_path, settings, context, request_id)}, request_id)
                return
            if route == "/api/v1/system/backup":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"backup": production.create_backup(database_path, settings, context, body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/system/backups/") and route.endswith("/verify"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"backup": production.verify_backup(database_path, context, route.split("/")[-2], request_id)}, request_id)
                return
            if route in {"/api/v1/system/restore", "/api/v1/system/restore-rehearsal"}:
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"restore": production.restore_rehearsal(database_path, settings, context, body, request_id)}, request_id)
                return
            if route == "/api/v1/system/release/qualify":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"release": production.qualify_release(database_path, settings, ROOT, context, body, request_id)}, request_id)
                return
            if route == "/api/v1/conversations":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"conversation": asst.create_conversation(database_path, context, body, request_id)}, request_id)
                return
            if route == "/api/v1/assistant/chat":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, asst.chat(database_path, context, body, request_id), request_id)
                return
            if route == "/api/v1/assistant/stream":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, asst.chat(database_path, context, body, request_id, True), request_id)
                return
            if route == "/api/v1/assistant/structured":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"structured_response": asst.generate_structured(database_path, context, body, request_id)}, request_id)
                return
            if route == "/api/v1/assistant/settings":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"settings": asst.update_settings(database_path, context, body, request_id)}, request_id)
                return
            if route == "/api/v1/assistant/request":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, planning.handle_request(database_path, context, body, request_id), request_id)
                return
            if route == "/api/v1/assistant/propose":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"proposal": actions.create_proposal(database_path, context, body, request_id)}, request_id)
                return
            if route == "/api/v1/proposals":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"proposal": actions.create_proposal(database_path, context, body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/proposals/"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                parts = route.split("/")
                proposal_id = parts[-2]
                action = parts[-1]
                if action == "approve":
                    self.respond(HTTPStatus.OK, actions.approve_proposal(database_path, context, proposal_id, body, request_id), request_id)
                    return
                if action == "reject":
                    self.respond(HTTPStatus.OK, {"proposal": actions.reject_proposal(database_path, context, proposal_id, body, request_id)}, request_id)
                    return
            if route == "/api/v1/executions":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"execution": actions.execute(database_path, context, body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/executions/") and route.endswith("/rollback"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"execution": actions.rollback(database_path, context, route.split("/")[-2], request_id)}, request_id)
                return
            if route == "/api/v1/memories":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"memory": memory.create_memory(database_path, context, body, request_id)}, request_id)
                return
            if route == "/api/v1/memories/retrieve":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"memory_context": memory.retrieve_memories(database_path, context, body, request_id)}, request_id)
                return
            if route == "/api/v1/memories/personalize":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, memory.personalize(database_path, context, body, request_id), request_id)
                return
            if route == "/api/v1/memories/clear":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, memory.clear_memory(database_path, context, body, request_id), request_id)
                return
            if route.startswith("/api/v1/memories/"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                parts = route.split("/")
                self.respond(HTTPStatus.OK, {"memory": memory.memory_action(database_path, context, parts[-2], parts[-1], request_id)}, request_id)
                return
            if route == "/api/v1/memory/proposals":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"proposal": memory.create_memory_proposal(database_path, context, body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/memory/proposals/"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                parts = route.split("/")
                self.respond(HTTPStatus.OK, {"proposal": memory.decide_memory_proposal(database_path, context, parts[-2], parts[-1], request_id)}, request_id)
                return
            if route == "/api/v1/preferences":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"preferences": memory.upsert_preference(database_path, context, body, request_id)}, request_id)
                return
            if route == "/api/v1/memory/privacy":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"privacy": memory.update_privacy_settings(database_path, context, body, request_id)}, request_id)
                return
            if route == "/api/v1/outcomes":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"outcome": memory.create_outcome(database_path, context, body, request_id)}, request_id)
                return
            if route == "/api/v1/routines":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"routine": memory.create_routine(database_path, context, body, request_id)}, request_id)
                return
            if route == "/api/v1/automations":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"automation": automation.create_automation(database_path, context, body, request_id)}, request_id)
                return
            if route == "/api/v1/automations/run-due":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, automation.run_due_automations(database_path, context, request_id), request_id)
                return
            if route.startswith("/api/v1/automations/"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                parts = route.split("/")
                self.respond(HTTPStatus.OK, automation.automation_action(database_path, context, parts[-2], parts[-1], request_id, body), request_id)
                return
            if route == "/api/v1/connectors":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"connector": connectors.create_connector(database_path, context, body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/connectors/"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                parts = route.split("/")
                connector_id = parts[-2]
                action = parts[-1]
                if action == "authorize":
                    self.respond(HTTPStatus.OK, {"connector": connectors.authorize_connector(database_path, context, connector_id, body, request_id)}, request_id)
                    return
                if action == "refresh":
                    self.respond(HTTPStatus.OK, {"connector": connectors.refresh_authorization(database_path, context, connector_id, request_id)}, request_id)
                    return
                if action == "sync":
                    self.respond(HTTPStatus.OK, {"synchronization": connectors.synchronize(database_path, context, connector_id, body, request_id)}, request_id)
                    return
                if action == "disconnect":
                    self.respond(HTTPStatus.OK, {"connector": connectors.disconnect_connector(database_path, context, connector_id, request_id)}, request_id)
                    return
                if action == "health":
                    self.respond(HTTPStatus.OK, {"connector": connectors.health_check(database_path, context, connector_id, request_id)}, request_id)
                    return
            if route.startswith("/api/v1/synchronization-conflicts/") and route.endswith("/resolve"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"conflict": connectors.resolve_conflict(database_path, context, route.split("/")[-2], body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/conversations/"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                parts = route.split("/")
                conversation_id = parts[-2]
                action = parts[-1]
                if action == "messages":
                    self.respond(HTTPStatus.CREATED, {"message": asst.append_message(database_path, context, conversation_id, body, request_id)}, request_id)
                    return
                if action == "retry":
                    self.respond(HTTPStatus.OK, asst.retry_last(database_path, context, conversation_id, request_id), request_id)
                    return
                self.respond(HTTPStatus.OK, {"conversation": asst.conversation_action(database_path, context, conversation_id, action, request_id)}, request_id)
                return
            if route == "/api/v1/notebooks":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"notebook": notes.create_notebook(database_path, context, body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/notebooks/"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                parts = route.split("/")
                self.respond(HTTPStatus.OK, {"notebook": notes.notebook_action(database_path, context, parts[-2], parts[-1], request_id)}, request_id)
                return
            if route == "/api/v1/notes":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"note": notes.create_note(database_path, context, body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/notes/"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                parts = route.split("/")
                note_id = parts[-2]
                action = parts[-1]
                if action == "restore-version":
                    self.respond(HTTPStatus.OK, {"note": notes.restore_version(database_path, context, note_id, body, request_id)}, request_id)
                    return
                if action == "attachments":
                    self.respond(HTTPStatus.CREATED, {"attachment": notes.add_attachment(database_path, context, note_id, body, request_id)}, request_id)
                    return
                if action == "links":
                    self.respond(HTTPStatus.CREATED, {"link": notes.create_link(database_path, context, note_id, body, request_id)}, request_id)
                    return
                self.respond(HTTPStatus.OK, {"note": notes.note_action(database_path, context, note_id, action, request_id)}, request_id)
                return
            if route == "/api/v1/calendars":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"calendar": cal.create_calendar(database_path, context, body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/calendars/"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                parts = route.split("/")
                self.respond(HTTPStatus.OK, {"calendar": cal.calendar_action(database_path, context, parts[-2], parts[-1], request_id)}, request_id)
                return
            if route == "/api/v1/events":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"event": cal.create_event(database_path, context, body, request_id)}, request_id)
                return
            if route == "/api/v1/calendar/availability":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"availability": cal.availability(database_path, context, body)}, request_id)
                return
            if route.startswith("/api/v1/events/"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                parts = route.split("/")
                if len(parts) >= 6 and parts[-3] == "occurrences":
                    event_id = parts[-4]
                    occurrence_key = parts[-2]
                    self.respond(HTTPStatus.OK, {"event": cal.occurrence_action(database_path, context, event_id, occurrence_key, parts[-1], request_id, body)}, request_id)
                    return
                event_id = parts[-2]
                action = parts[-1]
                if action == "recurrence":
                    self.respond(HTTPStatus.OK, {"event": cal.create_recurrence(database_path, context, event_id, body, request_id)}, request_id)
                    return
                if action == "split-series":
                    self.respond(HTTPStatus.CREATED, {"event": cal.split_series(database_path, context, event_id, body, request_id)}, request_id)
                    return
                if action == "preparation-items":
                    self.respond(HTTPStatus.CREATED, {"preparation_item": cal.create_preparation_item(database_path, context, event_id, body, request_id)}, request_id)
                    return
                if len(parts) >= 7 and parts[-2] == "tasks":
                    self.respond(HTTPStatus.OK, {"link": cal.link_task(database_path, context, parts[-3], parts[-1], request_id)}, request_id)
                    return
                if len(parts) >= 7 and parts[-2] == "followups":
                    self.respond(HTTPStatus.OK, {"link": cal.link_followup(database_path, context, parts[-3], parts[-1], request_id)}, request_id)
                    return
                self.respond(HTTPStatus.OK, {"event": cal.event_action(database_path, context, event_id, action, request_id, body)}, request_id)
                return
            if route == "/api/v1/task-lists":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"task_list": prod.create_task_list(database_path, context, body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/task-lists/") and route.endswith("/archive"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"task_list": prod.archive_task_list(database_path, context, route.split("/")[-2], request_id)}, request_id)
                return
            if route == "/api/v1/projects":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"project": prod.create_project(database_path, context, body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/projects/") and route.endswith("/archive"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.OK, {"project": prod.archive_project(database_path, context, route.split("/")[-2], request_id)}, request_id)
                return
            if route == "/api/v1/tasks":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"task": prod.create_task(database_path, context, body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/tasks/"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                parts = route.split("/")
                task_id = parts[-2]
                action = parts[-1]
                target = {
                    "start": "IN_PROGRESS",
                    "complete": "COMPLETED",
                    "reopen": "PLANNED",
                    "cancel": "CANCELLED",
                    "archive": "ARCHIVED",
                    "restore": "PLANNED",
                    "defer": body.get("status", "PLANNED"),
                }.get(action)
                if target:
                    self.respond(HTTPStatus.OK, {"task": prod.transition_task(database_path, context, task_id, str(target), request_id, body)}, request_id)
                    return
            if route == "/api/v1/reminders":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"reminder": prod.create_reminder(database_path, context, body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/reminders/"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                parts = route.split("/")
                self.respond(HTTPStatus.OK, {"reminder": prod.reminder_action(database_path, context, parts[-2], parts[-1], request_id, body)}, request_id)
                return
            if route.startswith("/api/v1/notifications/"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                if route == "/api/v1/notifications/read-all":
                    self.respond(HTTPStatus.OK, prod.notification_action(database_path, context, None, "read-all"), request_id)
                    return
                parts = route.split("/")
                self.respond(HTTPStatus.OK, prod.notification_action(database_path, context, parts[-2], parts[-1]), request_id)
                return
            if route == "/api/v1/followups":
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                self.respond(HTTPStatus.CREATED, {"followup": prod.create_followup(database_path, context, body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/followups/"):
                context = validate_session(database_path, self.headers.get("Cookie"), request_id)
                parts = route.split("/")
                self.respond(HTTPStatus.OK, {"followup": prod.followup_action(database_path, context, parts[-2], parts[-1], request_id, body)}, request_id)
                return
            self.respond(HTTPStatus.NOT_FOUND, error_payload("NOT_FOUND", "Route not found.", request_id), request_id)
        except AuthError as exc:
            self.respond(
                HTTPStatus(exc.status),
                error_payload(exc.code, str(exc), request_id),
                request_id,
                extra_headers=_auth_error_headers(exc),
            )
        except json.JSONDecodeError:
            self.respond(
                HTTPStatus.BAD_REQUEST,
                error_payload("VALIDATION_ERROR", "Request body must be valid JSON.", request_id),
                request_id,
            )
        except Exception as exc:
            self.respond(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                error_payload("INTERNAL_ERROR", "The API encountered an unexpected error.", request_id, {"error": exc.__class__.__name__}, True),
                request_id,
            )

    def do_PATCH(self) -> None:
        request_id = self.headers.get("X-Request-ID", str(uuid4()))
        try:
            settings = load_settings()
            route = self.path.split("?", 1)[0]
            body = self.read_json()
            context = validate_session(settings.database_path, self.headers.get("Cookie"), request_id)
            if route == "/api/v1/users/me":
                user = update_profile(settings.database_path, context, body, request_id)
                self.respond(HTTPStatus.OK, {"user": user}, request_id)
                return
            if route == "/api/v1/settings":
                settings_payload = update_settings(settings.database_path, context, body, request_id)
                self.respond(HTTPStatus.OK, {"settings": settings_payload}, request_id)
                return
            if route.startswith("/api/v1/conversations/"):
                self.respond(HTTPStatus.OK, {"conversation": asst.update_conversation(settings.database_path, context, route.rsplit("/", 1)[-1], body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/notebooks/"):
                self.respond(HTTPStatus.OK, {"notebook": notes.update_notebook(settings.database_path, context, route.rsplit("/", 1)[-1], body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/notes/"):
                self.respond(HTTPStatus.OK, {"note": notes.update_note(settings.database_path, context, route.rsplit("/", 1)[-1], body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/calendars/"):
                self.respond(HTTPStatus.OK, {"calendar": cal.update_calendar(settings.database_path, context, route.rsplit("/", 1)[-1], body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/events/"):
                self.respond(HTTPStatus.OK, {"event": cal.update_event(settings.database_path, context, route.rsplit("/", 1)[-1], body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/task-lists/"):
                self.respond(HTTPStatus.OK, {"task_list": prod.update_task_list(settings.database_path, context, route.rsplit("/", 1)[-1], body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/projects/"):
                self.respond(HTTPStatus.OK, {"project": prod.update_project(settings.database_path, context, route.rsplit("/", 1)[-1], body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/tasks/"):
                self.respond(HTTPStatus.OK, {"task": prod.update_task(settings.database_path, context, route.rsplit("/", 1)[-1], body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/memories/"):
                self.respond(HTTPStatus.OK, {"memory": memory.update_memory(settings.database_path, context, route.rsplit("/", 1)[-1], body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/automations/"):
                self.respond(HTTPStatus.OK, {"automation": automation.update_automation(settings.database_path, context, route.rsplit("/", 1)[-1], body, request_id)}, request_id)
                return
            if route.startswith("/api/v1/followups/"):
                self.respond(HTTPStatus.OK, {"followup": prod.update_followup(settings.database_path, context, route.rsplit("/", 1)[-1], body, request_id)}, request_id)
                return
            self.respond(HTTPStatus.NOT_FOUND, error_payload("NOT_FOUND", "Route not found.", request_id), request_id)
        except AuthError as exc:
            self.respond(HTTPStatus(exc.status), error_payload(exc.code, str(exc), request_id), request_id)
        except Exception as exc:
            self.respond(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                error_payload("INTERNAL_ERROR", "The API encountered an unexpected error.", request_id, {"error": exc.__class__.__name__}, True),
                request_id,
            )

    def do_DELETE(self) -> None:
        request_id = self.headers.get("X-Request-ID", str(uuid4()))
        try:
            settings = load_settings()
            route = self.path.split("?", 1)[0]
            if route.startswith("/api/v1/auth/sessions/"):
                context = validate_session(settings.database_path, self.headers.get("Cookie"), request_id)
                session_id = route.rsplit("/", 1)[-1]
                revoke_session(settings.database_path, session_id, context, request_id)
                self.respond(HTTPStatus.OK, {"status": "revoked"}, request_id)
                return
            if route.startswith("/api/v1/conversations/"):
                context = validate_session(settings.database_path, self.headers.get("Cookie"), request_id)
                conversation_id = route.rsplit("/", 1)[-1]
                self.respond(HTTPStatus.OK, {"conversation": asst.delete_conversation(settings.database_path, context, conversation_id, request_id)}, request_id)
                return
            if route.startswith("/api/v1/notebooks/"):
                context = validate_session(settings.database_path, self.headers.get("Cookie"), request_id)
                notebook_id = route.rsplit("/", 1)[-1]
                self.respond(HTTPStatus.OK, {"notebook": notes.delete_notebook(settings.database_path, context, notebook_id, request_id)}, request_id)
                return
            if route.startswith("/api/v1/notes/"):
                context = validate_session(settings.database_path, self.headers.get("Cookie"), request_id)
                note_id = route.rsplit("/", 1)[-1]
                self.respond(HTTPStatus.OK, {"note": notes.delete_note(settings.database_path, context, note_id, request_id)}, request_id)
                return
            if route.startswith("/api/v1/attachments/"):
                context = validate_session(settings.database_path, self.headers.get("Cookie"), request_id)
                attachment_id = route.rsplit("/", 1)[-1]
                self.respond(HTTPStatus.OK, {"attachment": notes.remove_attachment(settings.database_path, context, attachment_id, request_id)}, request_id)
                return
            if route.startswith("/api/v1/calendars/"):
                context = validate_session(settings.database_path, self.headers.get("Cookie"), request_id)
                calendar_id = route.rsplit("/", 1)[-1]
                self.respond(HTTPStatus.OK, {"calendar": cal.delete_calendar(settings.database_path, context, calendar_id, request_id)}, request_id)
                return
            if route.startswith("/api/v1/events/"):
                context = validate_session(settings.database_path, self.headers.get("Cookie"), request_id)
                event_id = route.rsplit("/", 1)[-1]
                self.respond(HTTPStatus.OK, {"event": cal.delete_event(settings.database_path, context, event_id, request_id)}, request_id)
                return
            if route.startswith("/api/v1/tasks/"):
                context = validate_session(settings.database_path, self.headers.get("Cookie"), request_id)
                task_id = route.rsplit("/", 1)[-1]
                permanent = parse_query(self.path).get("permanent") == "true"
                self.respond(HTTPStatus.OK, {"task": prod.delete_task(settings.database_path, context, task_id, request_id, permanent)}, request_id)
                return
            if route.startswith("/api/v1/memories/"):
                context = validate_session(settings.database_path, self.headers.get("Cookie"), request_id)
                memory_id = route.rsplit("/", 1)[-1]
                self.respond(HTTPStatus.OK, {"memory": memory.delete_memory(settings.database_path, context, memory_id, request_id)}, request_id)
                return
            self.respond(HTTPStatus.NOT_FOUND, error_payload("NOT_FOUND", "Route not found.", request_id), request_id)
        except AuthError as exc:
            self.respond(HTTPStatus(exc.status), error_payload(exc.code, str(exc), request_id), request_id)
        except Exception as exc:
            self.respond(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                error_payload("INTERNAL_ERROR", "The API encountered an unexpected error.", request_id, {"error": exc.__class__.__name__}, True),
                request_id,
            )

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def respond(
        self,
        status: HTTPStatus,
        payload: dict[str, Any],
        request_id: str,
        extra_headers: dict[str, str] | None = None,
    ) -> None:
        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", "http://127.0.0.1:5174"))
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("X-Request-ID", request_id)
        for name, value in (extra_headers or {}).items():
            self.send_header(name, value)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", "http://127.0.0.1:5174"))
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Request-ID")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.end_headers()

    def log_message(self, format: str, *args: object) -> None:
        print(
            json.dumps(
                {
                    "event": "http_request",
                    "application": "day-to-day-assistant-api",
                    "client": self.client_address[0],
                    "message": format % args,
                }
            )
        )


def main() -> None:
    settings = load_settings()
    migrate(settings.database_path, ROOT / "apps" / "api" / "migrations")
    server = ThreadingHTTPServer((settings.api_host, settings.api_port), Handler)
    print(f"API listening on http://{settings.api_host}:{settings.api_port}")
    server.serve_forever()


if __name__ == "__main__":
    main()


def _auth_error_headers(exc: AuthError) -> dict[str, str]:
    if exc.code in {"SESSION_EXPIRED", "SESSION_REVOKED"}:
        return {"Set-Cookie": clear_session_cookie()}
    return {}


def parse_query(path: str) -> dict[str, str]:
    if "?" not in path:
        return {}
    query = path.split("?", 1)[1]
    return {key: value for key, value in parse_qsl(query, keep_blank_values=True)}
