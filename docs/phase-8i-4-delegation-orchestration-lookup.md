# Phase 8I.4 - Delegation & Orchestration Lookup

## Purpose

Phase 8I.4 adds deterministic, read-only operator visibility into delegated work and orchestration coordination. It answers what was delegated, why it was routed, which authority checks permitted or blocked the route, how dependencies controlled execution, which checkpoints were created, and what orchestration state transitions were recorded.

## Implementation

- `types/delegation-orchestration-lookup.ts` defines the immutable response, record, audit, observability, scenario, and failure contracts.
- `services/delegation-orchestration-lookup/index.ts` builds replay-stable delegation records, orchestration events, dependency records, checkpoint records, routing views, timelines, audit records, and validation surfaces.
- `app/api/delegation-orchestration-lookup/*` exposes the contract, full lookup, focused delegation/orchestration/routing/dependency/checkpoint/timeline views, and inspect/validation endpoints.
- `tests/unit/delegation-orchestration-lookup/delegationOrchestrationLookup.test.ts` verifies doctrine, deterministic ordering, read-only behavior, focused views, replay-stable hashes, and fail-closed error mapping.

## Read-Only Guarantees

The lookup service may inspect delegation records, orchestration records, routing decisions, dependency schedules, checkpoints, rollback preparation, replay references, lineage references, and integrity hashes. It never assigns tasks, reroutes work, unblocks work, executes work, mutates checkpoints, starts rollback, changes orchestration state, or changes authority decisions.

## Deterministic Ordering

All synthetic lookup evidence is ordered by the phase-required keys:

1. `tenant_id`
2. `mission_id`
3. `workflow_id`
4. `timestamp`
5. `autonomy_event_sequence`
6. `record_id`

Result hashes are derived from canonical record hashes, so identical replay inputs reconstruct identical delegation, orchestration, dependency, checkpoint, routing, timeline, and audit views.

## Operator Views

- Delegation lookup: operator tasks, certified agent tasks, approved external system tasks, deferred tasks, blocked tasks, authority validation, governance validation, and confidence.
- Orchestration lookup: task sequence, state transitions, dependency references, checkpoint references, rollback readiness, supervision references, governance references, replay references, and lineage references.
- Routing viewer: selected route, rejected routes, rationale, fallback route, routing confidence, authority validation, and governance constraints.
- Dependency search: satisfied, waiting, failed, and workflow-blocking dependencies with critical path flags.
- Checkpoint query: checkpoint state, rollback eligibility, checkpoint integrity, execution linkage, and replay references.
