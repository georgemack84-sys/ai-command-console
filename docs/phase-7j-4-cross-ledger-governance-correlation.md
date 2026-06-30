# Phase 7J.4 Cross-Ledger Governance Correlation

Phase 7J.4 implements deterministic cross-ledger governance correlation for Mission Control Governance Intelligence.

## Scope

- Correlates governance objects across Truth, Policy, Evidence, Recommendation, Compliance, Risk, Escalation, Replay, Integrity, and Lineage ledgers.
- Builds immutable governance relationship graphs from 7J.3 historical reconstruction records.
- Preserves evidence references, lineage references, replay references, relationship confidence, and canonical hashes.
- Supports relationship exploration through deterministic graph nodes and edges.
- Enforces tenant isolation, constitutional authority, replay verification, lineage verification, evidence completeness, hash validation, and read-only execution.

## Correlation Model

Each correlation includes:

- `correlation_id`
- `tenant_id`
- `mission_id`
- `source_ledger`
- `source_object`
- `target_ledger`
- `target_object`
- `relationship_type`
- `supporting_evidence`
- `lineage_reference`
- `replay_reference`
- `correlation_confidence`
- `created_timestamp`
- `correlation_hash`

## API Surface

- `GET /api/governance-cross-ledger-correlation/contract`
- `POST /api/governance-cross-ledger-correlation/correlate`
- `POST /api/governance-cross-ledger-correlation/validate`
- `POST /api/governance-cross-ledger-correlation/graph`
- `POST /api/governance-cross-ledger-correlation/relationships`
- `POST /api/governance-cross-ledger-correlation/replay`
- `GET|POST /api/governance-cross-ledger-correlation/inspect`
- `POST /api/governance-cross-ledger-correlation/hash`

## Error States

- `CORRELATION_NOT_FOUND`
- `LEDGER_REFERENCE_INVALID`
- `RELATIONSHIP_INCONSISTENT`
- `EVIDENCE_MISSING`
- `LINEAGE_BROKEN`
- `REPLAY_CORRELATION_FAILED`
- `HASH_MISMATCH`
- `TENANT_ISOLATION_VIOLATION`
- `CONSTITUTIONAL_VIOLATION`

## Certification Notes

The implementation is deterministic, fixture-backed, and read-only. It never mutates governance ledgers. Correlation, graph, edge, node, replay, validation, and response hashes are derived from canonical serialized payloads so identical historical state produces identical relationship graphs and correlation results.
