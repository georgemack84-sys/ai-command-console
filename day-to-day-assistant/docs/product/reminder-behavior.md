# Reminder Behavior

Phase D2D.3 reminders are local and in-app only.

Reminder states are `SCHEDULED`, `DUE`, `DELIVERED`, `ACKNOWLEDGED`, `SNOOZED`, `MISSED`, `COMPLETED`, and `CANCELLED`.

Due reminders are delivered when reminder, notification, or Today data is queried. Delivery creates an in-app notification and reminder delivery record. This dependency-light polling model is conditionally qualified until a dedicated long-running worker is added.

Snoozing cancels pending jobs and creates one new pending job with a unique idempotency key.
