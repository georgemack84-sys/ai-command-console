# Conflict Detection

Conflict detection retrieves calendar events for a requested window and filters them to events that block time. It compares timed intervals pairwise and emits conflicts for overlapping intervals.

Severity is `HARD` when both blocking events are confirmed. Otherwise severity is `TENTATIVE`. Cancelled, archived, free, and all-day events are ignored for conflict purposes.

The algorithm is intentionally simple for the local single-user phase and can be optimized later if event volume grows.
