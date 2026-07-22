# Phase 4 Qualification

Phase identifier: D2D.4
Phase name: Local Calendar
Status: CONDITIONALLY_QUALIFIED

Qualified locally:

- Calendar CRUD with default local calendar creation.
- Timed and all-day event creation, update, lifecycle actions, history, and audit.
- Local recurrence rules, occurrence expansion, and occurrence cancellation.
- Conflict detection and availability calculation.
- Event preparation items, task links, follow-up links, event reminder offsets, ICS export, search, and Today integration.
- Static web calendar and calendar-source views.

Conditional items:

- Recurrence is not a complete RFC 5545 implementation.
- Month/year recurrence and DST wall-clock behavior need a later hardening pass.
- Event reminders reuse the Phase 3 local reminder scheduler instead of a dedicated calendar scheduler.
- Browser end-to-end coverage remains smoke-level; service tests cover the main calendar behavior.
