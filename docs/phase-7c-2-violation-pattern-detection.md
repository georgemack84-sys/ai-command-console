# Phase 7C.2 - Violation Pattern Detection

## Purpose

Phase 7C.2 converts isolated governance events into deterministic, tenant-scoped violation pattern records. The layer is advisory-only: it detects recurrence, drift, escalation trends, exception normalization, replay failures, lineage gaps, and certification failure recurrence without enforcing policy or scoring final risk.

## Deliverables

- Violation pattern schema and lifecycle states in `types/violation-patterns.ts`.
- Deterministic detector, normalizer, time window engine, baseline comparator, confidence model, replay builder, validator, and observability surface in `services/violation-patterns/index.ts`.
- Authenticated API routes under `/api/violation-patterns/*`.
- Certification coverage in `tests/unit/violation-patterns/violationPatternDetection.test.ts`.

## Pattern Families

The detector supports recurring policy, control, governance boundary, tenant rule, and authority scope violations; policy and authority drift; escalation trends; exception and override recurrence; unresolved governance events; containment growth; policy conflict recurrence; operator intervention recurrence; certification failure recurrence; replay mismatch recurrence; lineage break recurrence; and evidence gap recurrence.

## Determinism

Time windows resolve to fixed timestamps. Inputs normalize to immutable source hashes and are deduplicated by source record id. Pattern identity and pattern hashes are derived from canonical contract content. Replay reconstructs the same pattern hash and fails closed on tampering.

## Validation

Pattern validation rejects missing tenant, mission, identity, model versions, evidence, lineage, replay references, confidence basis, time windows, unsupported states, hidden detection state, cross-tenant references, unsupported explanations, and hash mismatches.

## Operator Surface

The inspect surface exposes pattern type, strength, confidence, trend, frequency, baseline, windows, related policy references, evidence, lineage, replay status, model versions, explanation, risk candidate status, operator review recommendation, and validation failures.
