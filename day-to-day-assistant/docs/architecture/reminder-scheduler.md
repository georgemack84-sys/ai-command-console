# Reminder Scheduler

Phase D2D.3 implements database-backed reminder jobs and idempotent in-app delivery records.

Due reminders are processed on reminder, notification, and Today reads. This keeps the local application useful without a separate worker process in the bootstrap environment.

Future hardening should add a dedicated worker loop, stale claim release, retry backoff, dead-letter inspection, and restart qualification.
