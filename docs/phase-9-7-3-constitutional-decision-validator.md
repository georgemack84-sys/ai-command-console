# Mission Control Phase 9.7.3 - Constitutional Decision Validator

## Preview

Phase 9.7.3 implements the constitutional validation layer for governance decision records. It validates constitutional supremacy, advisory-only constraints, authority boundaries, prohibited execution, constitutional conflicts, explainability, immutable evidence, and ledger recording before downstream authority, tenant, certification, or enforcement phases.

## Tightened Contract

- Constitutional rules are immutable, ordered by constitutional precedence, integrity checked, and replay referenced.
- The validator produces `COMPLIANT`, `CONDITIONAL`, `VIOLATION`, or `UNKNOWN` evidence outcomes.
- Autonomous execution, direct command issuance, hidden execution, unauthorized automation, authority expansion, operator override, and constitutional bypass force fail-closed rejection.
- Governance policies remain subordinate to constitutional rules; policy evidence showing constitutional bypass is recorded as a constitutional conflict.
- The validator does not evaluate organizational governance policy, resolve approval authority, validate tenant isolation, certify execution, or perform external replay certification.

## Implementation

- Types: `types/constitutional-decision-validator.ts`
- Service: `services/constitutional-decision-validator/index.ts`
- Tests: `tests/unit/constitutional-decision-validator/constitutionalDecisionValidator.test.ts`

## Certification Evidence

The service publishes `getConstitutionalDecisionValidatorFoundation()`, plus rule creation, single-rule evaluation, full validation, replay, and observability APIs. Every validation produces a Constitutional Evidence Report and immutable Constitutional Decision Ledger record.
