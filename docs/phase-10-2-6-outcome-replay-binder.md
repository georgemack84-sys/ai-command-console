# Mission Control Phase 10.2.6 - Outcome Replay Binder

## Preview

Phase 10.2.6 adds the deterministic replay-binding layer for normalized outcomes. It binds certified outcomes to replay packages, ordered replay references, dependency records, validation metadata, and an append-only replay reference registry.

## Tightened Contract

The binder organizes and certifies replay dependencies only. It does not execute replay, mutate outcome records, repair divergence, or edit replay packages after creation. Every replay package is immutable, tenant-scoped, versioned, ordered, cryptographically verifiable, and fail-closed on divergence.

## Fail-Closed Validation

Certification blocks uncertified integrity input, missing replay dependencies, replay divergence, hash mismatch, lineage mismatch, Truth Ledger mismatch, evidence mismatch, cross-tenant replay, nondeterministic ordering, replay package mutation, registry append-only violations, incomplete dependency graphs, authorization failure, and fail-open behavior.

## Implementation

Implemented artifacts:

- `types/outcome-replay-binder.ts`
- `services/outcome-replay-binder/index.ts`
- `tests/unit/outcome-replay-binder/outcomeReplayBinder.test.ts`

The service composes `runOutcomeIntegrityValidator()`, builds replay packages and references, maps replay dependencies, validates divergence and ordering, writes append-only registry records, publishes advisory-only metrics, and exposes replay/hash helpers plus the phase foundation accessor.
