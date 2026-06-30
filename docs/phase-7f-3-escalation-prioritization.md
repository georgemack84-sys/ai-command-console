# Phase 7F.3 - Escalation Prioritization

Phase 7F.3 adds the deterministic prioritization layer for validated escalations from Phase 7F.2. The component assigns exactly one advisory priority level to every valid escalation and records the score, rationale, factors, confidence, lineage, replay references, and Truth Ledger references needed for certification.

## Delivered Surface

- `types/escalation-prioritization.ts` defines the prioritization contract, priority records, validation/replay results, metrics, observability surface, and doctrine.
- `services/escalation-prioritization/index.ts` implements deterministic scoring, governance impact analysis, confidence verification, priority lineage, Truth Ledger integration, replay, validation, metrics, and operator visibility.
- `app/api/escalation-prioritization/*` exposes contract, prioritize, validate, replay, hash, metrics, and inspect endpoints.
- `tests/unit/escalation-prioritization/escalationPrioritization.test.ts` certifies deterministic scoring, priority levels, replay, lineage, advisory-only constraints, tenant isolation, and failure handling.

## Priority Model

Priority levels are fixed to `INFO`, `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`.

Scores are deterministic:

- `CRITICAL`: score >= 90
- `HIGH`: score >= 70
- `MEDIUM`: score >= 45
- `LOW`: score >= 20
- `INFO`: score < 20

The engine evaluates constitutional impact, authority impact, policy impact, compliance impact, operational governance impact, risk impact, evidence quality, replay integrity, and historical context. Constitutional and governance integrity cases take precedence through fixed scoring rules.

## Governance Guarantees

- Prioritization consumes 7F.2 detection output and does not detect triggers itself.
- Every valid escalation receives exactly one priority record.
- Priority IDs and hashes are deterministic.
- Confidence is evidence-backed and hash-verifiable.
- Lineage records priority identity, escalation identity, history, and trigger chain.
- Truth Ledger references are required for non-empty prioritization results.
- Replay reconstructs the same priority records and prioritization hash.
- Tenant isolation rejects cross-tenant references.
- The component remains advisory-only and has no execution, mutation, policy modification, operator override, or recommendation authority.

## Certification Coverage

The 7F.3 test suite verifies:

- supported doctrine and baseline contract
- deterministic priority assignment
- all five priority levels
- constitutional, authority, policy, compliance, process, risk, evidence, replay, and integrity impact scoring
- confidence and explainability
- lineage, replay refs, ledger refs, and advisory-only boundaries
- no-escalation handling
- invalid escalation records
- unsupported priority levels
- missing evidence and governance context
- replay mismatch and broken lineage
- source detection failures
- hidden state and tenant leaks
- record/result hash tampering
- metrics and operator visibility
