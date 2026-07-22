# Local Calendar Module

The local calendar module is implemented in `apps/api/src/day_to_day_assistant_api/calendar.py` with SQLite-backed migrations in `apps/api/migrations/0004_local_calendar.sql`.

It owns calendars, events, event history, recurrence rules, recurrence exceptions, event reminder links, preparation items, task links, and follow-up links. It depends on the identity session context for ownership checks and on productivity services only for activity records and reminder creation.

The web application exposes calendar and calendar-source views through the static SPA. The API remains authoritative for validation and permissions.
