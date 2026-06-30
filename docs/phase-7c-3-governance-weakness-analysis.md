# Phase 7C.3 - Governance Weakness Analysis

## Purpose

Phase 7C.3 converts recurring violation patterns into deterministic Governance Weakness findings. It explains why patterns are appearing, identifies weak or missing governance structures, binds every finding to evidence, lineage, and replay references, and recommends review priority without assigning final risk severity.

## Deliverables

- Governance weakness schema, category catalog, state model, confidence basis, review priority model, replay package, and validation vocabulary in `types/governance-weakness.ts`.
- Weakness input aggregation, pattern-to-weakness mapping, category analysis, weakness indicators, confidence engine, review priority engine, evidence binder, explanation engine, hash/replay, validator, and observability surface in `services/governance-weakness/index.ts`.
- Authenticated API routes under `/api/governance-weakness/*`.
- Certification tests in `tests/unit/governance-weakness/governanceWeaknessAnalysis.test.ts`.

## Weakness Coverage

The analyzer identifies weak controls, missing controls, ambiguous policy, unresolved policy conflicts, authority boundary weakness, escalation path weakness, oversight deficiency, repeated exception dependency, certification gaps, replay gaps, lineage gaps, evidence gaps, visibility gaps, and tenant boundary weakness.

## Determinism

The mapping model is fixed as `GOV-WEAKNESS-MAPPING-V1`. Input patterns are deduplicated by pattern identity, grouped by weakness category, and converted into immutable weakness records with canonical hashes. Replay reconstructs the same weakness hash and fails closed on tampering.

## Confidence And Review

Confidence is separate from final risk severity and uses supporting pattern count, evidence count, source quality, pattern confidence average, lineage completeness, replay status, policy/control match strength, historical recurrence, evidence completeness, and tenant validation status. Review priority is deterministic and can be `WATCH`, `STANDARD_REVIEW`, `PRIORITY_REVIEW`, or `IMMEDIATE_REVIEW`.

## Operator Surface

Operators can inspect weakness category, type, state, supporting pattern ids, related policies, controls, authority scopes, violations, exceptions, escalations, certification results, replay records, containment events, weakness indicators, confidence basis, review priority, evidence, lineage, replay status, model versions, explanation, and validation failures.
