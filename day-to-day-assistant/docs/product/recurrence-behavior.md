# Recurrence Behavior

Phase 4 supports local event recurrence for daily, weekly, monthly, and yearly rules. The current recurrence engine expands occurrences from the series event for a requested date window and gives each occurrence a stable `occurrence_key` based on the generated start timestamp.

Occurrence exceptions support cancellation, restoration, and modified replacement events. Cancelled occurrences are suppressed from expanded results, while modified occurrences can point to replacement events.

Conditional limitation: monthly and yearly recurrence currently use fixed day intervals instead of calendar-aware month and year arithmetic. Full DST-aware local recurrence semantics are deferred to a later hardening pass.
