# Scheduler Recovery

Current recovery behavior is deterministic for pending jobs: if the application restarts before a reminder is delivered, the pending job remains in the database and is processed on the next reminder, notification, or Today read.

Future worker recovery must add stale claim release, retry scheduling, dead-letter handling, worker health, and late reminder policy enforcement beyond read-triggered processing.
