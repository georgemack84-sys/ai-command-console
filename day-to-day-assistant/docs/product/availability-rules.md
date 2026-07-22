# Availability Rules

Availability is calculated from visible, non-archived timed events in the requested window. Events block time when their status is `CONFIRMED` or `TENTATIVE` and their availability status is `BUSY`, `TENTATIVE`, or `OUT_OF_OFFICE`.

All-day events do not currently block availability slots. Busy intervals are merged before free windows are calculated. The caller supplies a minimum slot duration in minutes.

Conflict detection uses the same blocking rules and reports overlapping blocking events as hard conflicts when both events are confirmed, otherwise tentative conflicts.
