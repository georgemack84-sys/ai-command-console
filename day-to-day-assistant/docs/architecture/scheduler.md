# Scheduler

The scheduler stores next-run state in the database so it can recover after restarts.

Supported trigger schedules include hourly, daily, weekly, monthly, yearly, date, and manual. Time schedules are timezone-aware. One-time date triggers can catch up once if missed, then become unscheduled after successful execution. Manual automations do not receive scheduled jobs.

The scheduler is deterministic: the automation ID, scheduled time, user, and trigger type produce the idempotency key used by executions and jobs. Repeated due-run scans cannot duplicate completed executions.
