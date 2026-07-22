# Mission Control Phase 10.3.1 - Recommendation Effectiveness Contract

## Preview

Phase 10.3.1 adds the deterministic contract for evaluating recommendation effectiveness after operator action, observed outcome capture, evidence completion, governance validation, replay validation, and Truth Ledger binding.

## Tightened Contract

The contract measures completed recommendation lifecycles only. It does not decide whether a recommendation was originally correct, learn from outcomes, mutate historical recommendations, change operator actions, or automatically alter future recommendation behavior. Every evaluation is tenant-scoped, advisory-only, evidence-backed, replayable, append-only, cryptographically verifiable, and fail-closed.

## Mandatory Evaluation Surface

Every certified evaluation must include recommendation, decision, operator, outcome, evidence, risk, confidence, governance, replay, lineage, ledger, and integrity references. Every certified evaluation must also score all canonical dimensions: overall effectiveness, outcome accuracy, risk accuracy, confidence accuracy, evidence quality, governance accuracy, explainability, operator usability, recommendation completeness, alternative recommendation quality, rollback quality, and decision package clarity.

## Fail-Closed Validation

Certification blocks missing observed outcomes, missing evidence, missing governance, missing replay, missing operator action, incomplete lineage, missing scores, replay divergence, integrity hash mismatch, tenant isolation violation, recommendation identity mismatch, ledger mutation, authority failure, constitutional failure, fail-open behavior, and attempts to mutate operator or recommendation history.

## Implementation

Implemented artifacts:

- `types/recommendation-effectiveness-contract.ts`
- `services/recommendation-effectiveness-contract/index.ts`
- `app/api/recommendation-effectiveness-contract/*`
- `tests/unit/recommendation-effectiveness-contract/recommendationEffectivenessContract.test.ts`

The service composes the Phase 10.2.6 outcome replay binder, builds the canonical effectiveness record, calculates deterministic score dimensions, validates governance/replay/ledger/integrity constraints, exposes hash and replay helpers, and publishes an immutable foundation accessor for Phase 10.3.2.
