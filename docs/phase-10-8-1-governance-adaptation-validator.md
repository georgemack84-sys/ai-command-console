# Phase 10.8.1 - Governance Adaptation Validator

The Governance Adaptation Validator is the first governance control point for adaptive proposals. It validates each proposal against applicable policy before simulation, operator review, or downstream adaptive processing. It never approves execution; it only returns a deterministic, evidence-backed governance outcome.

## Tightened Prompt

Validate every adaptive proposal before it can move to simulation, operator review, or downstream adaptive processing. Resolve all applicable governance policies, execute required rules, verify dependencies, identify approvals and obligations, validate any exception request, determine escalation, and write an immutable governance ledger entry.

The validator must remain deterministic, replayable, explainable, evidence-backed, constitutionally compliant, advisory-only, operator-controlled, fail-closed, tenant-isolated, immutable, audit-ready, policy-driven, and lineage-preserving.

## Implemented Scope

- Typed governance validation contract in `types/governance-adaptation-validator.ts`.
- Deterministic service in `services/governance-adaptation-validator`.
- Policy, rule, dependency, approval, obligation, exception, escalation, validation, replay, and ledger outputs.
- Explicit advisory-only behavior with `execution_authority_granted: false`.
- Fail-closed handling for unresolved policies, missing rules, unverifiable dependencies, approval ambiguity, incomplete obligations, invalid exceptions, bypass attempts, replay gaps, audit gaps, missing lineage, hash failures, tenant isolation failures, replay divergence, ledger failures, nondeterminism, and fail-open behavior.
- Authenticated APIs under `/api/governance-adaptation-validator/*`.

## API Surface

- `GET /api/governance-adaptation-validator/contract`
- `POST /api/governance-adaptation-validator/validate`
- `POST /api/governance-adaptation-validator/policies`
- `POST /api/governance-adaptation-validator/rules`
- `POST /api/governance-adaptation-validator/dependencies`
- `POST /api/governance-adaptation-validator/approvals`
- `POST /api/governance-adaptation-validator/obligations`
- `POST /api/governance-adaptation-validator/exceptions`
- `POST /api/governance-adaptation-validator/escalations`
- `POST /api/governance-adaptation-validator/ledger`
- `POST /api/governance-adaptation-validator/replay`
- `GET|POST /api/governance-adaptation-validator/inspect`

## Validation States

- `COMPLIANT`
- `COMPLIANT_WITH_APPROVAL`
- `REQUIRES_OPERATOR_REVIEW`
- `REQUIRES_GOVERNANCE_REVIEW`
- `REQUIRES_EXECUTIVE_REVIEW`
- `POLICY_CONFLICT`
- `RESTRICTED`
- `REJECTED`
- `FAIL_CLOSED`

## Certification Notes

- A compliant result can still require approval; the validator records approval requirements but does not grant authority.
- Invalid constitutional exceptions are rejected.
- Governance, simulation, and operator bypass attempts fail closed.
- Replay compares deterministic validation and integrity hashes.
