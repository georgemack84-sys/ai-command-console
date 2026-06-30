# Phase 8I.8 - Cross-Reference Search

## Purpose

Phase 8I.8 provides deterministic, read-only discovery of relationships between autonomous records across planning, execution, delegation, orchestration, supervision, intervention, replay, integrity, governance, confidence, outcome, failure, and rollback ledgers.

## Implementation

- `types/autonomy-cross-reference-search.ts` defines cross-reference records, statuses, resolver results, conflict findings, missing reference findings, viewer rows, audit records, response contracts, inputs, and observability surfaces.
- `services/autonomy-cross-reference-search/index.ts` builds the canonical cross-reference index, resolves source and target records, detects stale/missing/conflicting references, and renders cross-ledger viewer rows.
- `app/api/autonomy-cross-reference-search/*` exposes contract, search, records, index, resolver, conflicts, missing references, viewer, and inspect/validation endpoints.
- `tests/unit/autonomy-cross-reference-search/autonomyCrossReferenceSearch.test.ts` verifies doctrine, deterministic hashes, lineage composition, resolver modes, stale/missing/conflict detection, tenant rejection, and fail-closed error mapping.

## Reference Statuses

- `VALID`: source and target records resolve with matching tenant, mission, replay, lineage, and integrity evidence.
- `STALE`: the reference points at superseded or archived evidence.
- `MISSING`: the source or target reference cannot be resolved.
- `CONFLICTING`: the relationship contradicts another ledger, policy, replay, lineage, confidence, outcome, failure, or rollback record.
- `UNAUTHORIZED`: the reference violates tenant, mission, or governance visibility.
- `INVALID`: immutable ID, replay, lineage, or integrity evidence failed validation.

## Read-Only Guarantees

Cross-reference search may inspect records, resolve references, detect missing links, detect stale links, surface conflicts, and render cross-ledger relationships. It may never repair references, rewrite history, modify ledgers, change lineage, update replay, alter integrity records, execute rollback, or change policy decisions.

## Deterministic Ordering

Cross-ledger links are ordered by:

1. `tenant_id`
2. `mission_id`
3. `ledger_source`
4. `source_record_type`
5. `source_record_id`
6. `relationship_type`
7. `target_record_type`
8. `target_record_id`
