# Reminder Worker

The current reminder processor is read-triggered: reminder, notification, and Today endpoints process due pending reminder jobs.

Operational implications:

- reminders persist across restart;
- due reminders deliver after the next relevant application read;
- duplicate notifications are prevented by unique notification and job idempotency keys;
- a dedicated background worker remains future hardening work.
