# Knowledge Review Work Queue

- Phase: Phase 0, Part XIV
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)

## Purpose

The queue turns a deterministic freshness assessment into a durable review work item. It does not perform a review or enact its consequence.

```text
REVIEW_DUE -> QUEUED (NORMAL priority)
OVERDUE    -> QUEUED (HIGH priority)
Persisted review -> work item COMPLETED
```

## Rules

- Only an active record with matching `REVIEW_DUE` or `OVERDUE` freshness may be queued.
- At most one open work item exists for a knowledge record; a repeat is an idempotent replay.
- Completion requires a persisted review whose target knowledge ID matches the work item. Completion links that review ID in immutable work-item history.
- Queue, completion, and audit emission are governed persistence boundaries. Production adapters must make each state update and audit event transactional.
- Queue priority coordinates attention only. It cannot automatically invoke revalidation, quarantine, archival, correction, execution, or authority change.

## Guardrail

```text
Freshness identifies need.
Queue tracks need.
Revalidation records outcome.
Lifecycle boundaries enact approved consequence.
```
