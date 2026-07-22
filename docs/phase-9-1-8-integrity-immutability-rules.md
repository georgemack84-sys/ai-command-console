# Mission Control Phase 9.1.8 - Integrity & Immutability Rules

## Preview

Phase 9.1.8 adds the integrity layer for Mission Control decision records. It makes decision evidence reproducible, hashable, append-only, and replay-safe without turning the decision engine into an executor or policy enforcer.

## Tightened Scope

- Canonical decision serialization uses deterministic JSON key ordering, stable primitive normalization, and SHA-256 hashing.
- Integrity records bind orchestration, tenant, mission, replay, lineage, audit, and ledger identity.
- Validation fails closed for hash mismatches, serialization drift, ordering violations, historical mutation, replay failure, lineage failure, tenant boundary violations, and evidence tampering.
- Ledger entries are append-only and ordered; overwrite and deletion attempts are modeled as integrity failures.
- Replay and lineage hashes are first-class verification inputs.
- Observability reports verification volume, failure counts, mutation events, ordering violations, append-only violations, serialization mismatches, replay failures, algorithm usage, and success rate.

## Implementation

- `types/decision-integrity.ts` defines verification states, failure codes, integrity records, metadata, audit records, ledger entries, validation results, mutation reports, and observability metrics.
- `services/decision-integrity/index.ts` implements canonical serialization, SHA-256 hashing, integrity evaluation construction, validation, mutation detection, ordering validation, replay hash validation, and observability aggregation.
- `tests/unit/decision-integrity/decisionIntegrity.test.ts` verifies the baseline contract, deterministic serialization, metadata binding, all required fail-closed scenarios, mutation detection, replay/ordering entrypoints, and metrics.

## Verification States

- `UNVERIFIED`
- `VERIFIED`
- `HASH_MISMATCH`
- `SERIALIZATION_FAILURE`
- `ORDERING_FAILURE`
- `MUTATION_DETECTED`
- `REPLAY_FAILURE`
- `LINEAGE_FAILURE`

## Public API

- `serializeDecisionCanonically`
- `generateDecisionIntegrityHash`
- `createDecisionIntegrityRecord`
- `createDecisionIntegrityEvaluation`
- `validateDecisionIntegrity`
- `detectDecisionMutation`
- `validateDecisionOrdering`
- `validateReplayIntegrityHash`
- `buildDecisionIntegrityObservability`
- `getDecisionIntegrityFramework`
