# Mission Control Phase 10.3.2 - Expected vs Actual Comparator

## Preview

Phase 10.3.2 adds the deterministic comparison engine for measuring how expected recommendation effects align with observed mission outcomes after execution.

## Tightened Contract

The comparator measures prediction accuracy only. It does not evaluate acceptance, rewrite outcomes, modify recommendations, alter operator actions, learn adaptively, or certify effectiveness by itself. Every comparison is tenant-scoped, evidence-backed, governance-validated, replayable, append-only, cryptographically verifiable, explainable, and fail-closed.

## Comparison Domains

Every certified comparison covers mission impact, risk, confidence, operator behavior, governance, and recommendation effect. Expected values must either align to observed counterparts or be explicitly marked not observable. Every variance includes deterministic calculation output, severity, category, explanation, evidence references, governance references, replay references, lineage references, and ledger bindings.

## Fail-Closed Validation

Certification blocks missing expected values, missing observed values, incomplete evidence, missing governance, missing replay, incomplete lineage, integrity mismatch, replay divergence, tenant isolation violation, recommendation reconstruction failure, observed outcome unavailability, ledger mutation, constitutional failure, fail-open behavior, and unexplained variance.

## Implementation

Implemented artifacts:

- `types/expected-vs-actual-comparator.ts`
- `services/expected-vs-actual-comparator/index.ts`
- `app/api/expected-vs-actual-comparator/*`
- `tests/unit/expected-vs-actual-comparator/expectedVsActualComparator.test.ts`

The service composes the Phase 10.3.1 Recommendation Effectiveness Contract, builds deterministic expected and observed states, aligns every comparison domain, calculates and classifies variance, validates governance/replay/ledger/integrity constraints, and exposes hash/replay/foundation helpers for Phase 10.3.3.
