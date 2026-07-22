# Task Lifecycle

Phase D2D.3 tasks support `INBOX`, `PLANNED`, `IN_PROGRESS`, `WAITING`, `BLOCKED`, `COMPLETED`, `CANCELLED`, and `ARCHIVED`.

Priority values are `NONE`, `LOW`, `MEDIUM`, `HIGH`, and `URGENT`.

Normal removal archives a task. Permanent deletion is available only through an explicit API flag and remains outside the primary UI.

Each task change writes task history, activity, and audit events. Recurring task completion creates at most one next occurrence through a unique recurrence series and occurrence number.
