# Follow-Up Model

Follow-ups track waiting-for obligations and expected responses.

Persisted lifecycle states are `OPEN`, `WAITING`, `RESOLVED`, `CANCELLED`, and `ARCHIVED`. Timing classifications such as `DUE_TODAY`, `DUE_SOON`, `OVERDUE`, and `NO_REVIEW_DATE` are computed so state does not drift merely because time passes.

Each follow-up can record responsible party, expected result, review date, due date, priority, last contact, next action, and resolution note.
