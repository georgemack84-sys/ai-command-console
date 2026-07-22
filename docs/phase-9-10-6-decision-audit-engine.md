# Phase 9.10.6 - Decision Audit Engine

## Preview

The Decision Audit Engine generates the certification-ready audit package for decision orchestration. It consolidates replay, diff, snapshot, trace, governance, constitutional, operator, evidence, integrity, and lineage data into a deterministic immutable audit record.

## Tightened Contract

- The audit engine documents orchestration and never changes outcomes.
- Every required audit section must be generated and traceable to immutable evidence.
- Compliance summaries cover governance, constitution, authority, replay, integrity, and certification.
- Certification evidence packages aggregate orchestration, replay, governance, constitutional, operator, integrity, and lineage references.
- Audit records and packages are hash-verifiable and committed to append-only ledgers.
- Missing evidence, governance documentation, constitutional documentation, replay verification, integrity verification, certification evidence, broken lineage, tenant mismatch, unsupported schema, and validation failures fail closed.

## Implementation

- Types: `types/decision-audit-engine.ts`
- Service: `services/decision-audit-engine/index.ts`
- Tests: `tests/unit/decision-audit-engine/decisionAuditEngine.test.ts`

The service provides audit artifact loading, audit generation, compliance analysis, certification evidence building, audit validation, deterministic integrity hashing, and immutable audit ledger writing for Phase 9.10 certification.
