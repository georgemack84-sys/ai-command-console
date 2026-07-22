# Mission Control Phase 9.1.7 - Replay & Lineage Contract

## Purpose

Phase 9.1.7 establishes the canonical Replay & Lineage Contract for Mission Control decisions. It defines replay references, lineage records, parent and child relationships, replay metadata, deterministic ordering, validation rules, reconstruction summaries, integrity hashing, and observability.

This phase defines the contractual structure consumed by replay and certification systems. It does not execute replay.

## Canonical Implementation

- `types/decision-replay-lineage.ts`
- `services/decision-replay-lineage/index.ts`
- `tests/unit/decision-replay-lineage/decisionReplayLineage.test.ts`

## Replay Model

The replay reference model records:

- `replay_reference_id`
- `orchestration_id`
- `tenant_id`
- `mission_id`
- `replay_type`
- `source_component`
- `referenced_record_id`
- `replay_order`
- `replay_version`
- `integrity_hash`
- `replay_timestamp`
- `lineage_refs`
- `created_at`

Supported replay references include input, evidence, governance, constitutional, authority, decision, lifecycle, and lineage records. The canonical ordering is explicit and reproducible.

## Lineage Model

The lineage record captures parent decision id, child decision ids, input refs, evidence refs, governance refs, constitutional refs, authority refs, replay refs, decision output refs, tenant and mission ownership, append-only status, and integrity hash.

Parent and child relationships are immutable, tenant-isolated, mission-isolated, acyclic, and replay-compatible.

## APIs

- `createReplayReference()`
- `buildDecisionLineage()`
- `createReplayLineageContract()`
- `validateReplayReferences()`
- `validateDecisionLineage()`
- `validateReplayIntegrity()`
- `validateReplayLineageContract()`
- `reconstructDecisionHistory()`
- `buildReplayLineageObservability()`
- `getDecisionReplayLineageContract()`

## Guarantees

Validation fails closed for missing references, duplicate replay identifiers, broken lineage, invalid parents, invalid children, circular lineage, replay ordering violations, unsupported replay versions, unknown references, tenant or mission violations, hash mismatches, and serialization mismatches.

Historical reconstruction produces the same replay sequence, referenced record ids, lineage id, and deterministic hash for identical inputs.

## Exit Criteria

Phase 9.1.7 is complete when replay references and lineage records are implemented, parent-child relationship validation is enforced, replay metadata captures versioning and ordering, reconstruction is deterministic, validation fails closed for inconsistencies, governance/constitutional/authority lineage is preserved, and focused tests cover valid replay plus boundary failures.
