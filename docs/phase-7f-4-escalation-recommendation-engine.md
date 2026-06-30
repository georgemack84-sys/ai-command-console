# Phase 7F.4 - Escalation Recommendation Engine

Phase 7F.4 adds the deterministic advisory layer that transforms prioritized escalations from Phase 7F.3 into governance recommendations for human operators and governance authorities.

## Delivered Surface

- `types/escalation-recommendation.ts` defines recommendation records, supported recommendation types, validation and replay results, metrics, observability, and doctrine.
- `services/escalation-recommendation/index.ts` implements the response decision matrix, evidence-backed recommendation generation, confidence calculation, lineage, Truth Ledger recording, replay, validation, metrics, and operator visibility.
- `app/api/escalation-recommendation/*` exposes contract, recommend, validate, replay, hash, metrics, and inspect endpoints.
- `tests/unit/escalation-recommendation/escalationRecommendation.test.ts` certifies deterministic generation, replay, evidence, context, tenant isolation, and advisory-only behavior.

## Decision Matrix

- `INFO`: Operator Notification
- `LOW`: Operator Notification + Governance Review
- `MEDIUM`: Governance Review + Policy Review
- `HIGH`: Governance Review + Compliance Review + Authority Review
- `CRITICAL`: Emergency Governance Review + Constitutional Review + Operator Notification

The matrix is fixed and replayable. The engine consumes priority assignments; it does not detect escalations or assign priority.

## Governance Guarantees

- Recommendations are generated from validated 7F.3 priority records.
- Recommendation IDs and hashes are deterministic.
- Every recommendation records governance context, supporting evidence, confidence, lineage, replay references, Truth Ledger references, and explainability.
- Replay reconstructs the same recommendation types, evidence, confidence, lineage, and result hash.
- Tenant isolation rejects cross-tenant references.
- The engine is advisory-only: no execution, mutation, policy modification, approval, remediation, or operator override authority.

## Certification Coverage

The 7F.4 test suite verifies:

- doctrine and supported recommendation categories
- decision matrix behavior for all priority levels
- deterministic recommendation IDs, ordering, and hashes
- constitutional, authority, policy, compliance, and emergency review generation
- governance context, evidence, confidence, explainability, lineage, replay, and Truth Ledger refs
- no-escalation handling
- invalid source prioritization and missing priority assignments
- unsupported recommendation types
- missing evidence and incomplete governance context
- replay gaps and broken lineage
- hidden state, cross-tenant references, and authority leakage
- record and result tamper detection
- metrics and operator visibility
