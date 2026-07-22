# Phase 10.8.2 - Constitutional Adaptation Validator

The Constitutional Adaptation Validator is the highest-order safety gate in the Governance-Aware Adaptation Layer. It determines whether an adaptive proposal is constitutionally permissible before simulation, governance review, or operator evaluation. It does not decide whether a proposal is useful, and it never grants execution authority.

## Tightened Prompt

Validate every adaptive proposal against the Mission Control Constitution before it can proceed. Discover applicable constitutional guarantees, evaluate constitutional rules, validate protected principles, analyze conflicts, classify violations, automatically reject prohibited proposals, and persist an immutable constitutional ledger entry.

The validator must remain constitution-first, deterministic, replayable, explainable, evidence-backed, advisory-only, human-governed, operator-controlled, governance-enforced, fail-closed, tenant-isolated, immutable, audit-ready, and lineage-preserving.

## Implemented Scope

- Typed constitutional validation contract in `types/constitutional-adaptation-validator.ts`.
- Deterministic service in `services/constitutional-adaptation-validator`.
- Protected principle, rule, dependency, conflict, violation, automatic rejection, replay, and ledger outputs.
- Explicit highest-order constraints: `human_governed: true`, `operator_controlled: true`, `governance_enforced: true`, and `execution_authority_granted: false`.
- Automatic rejection for authority expansion, autonomous execution, historical truth mutation, and constitutional review bypass.
- Fail-closed handling for unresolved principles, incomplete rules, nondeterminism, weakened governance or operator supremacy, advisory-only violations, replay and audit degradation, evidence failures, tenant isolation failures, lineage gaps, hash failures, replay divergence, recording failures, and fail-open behavior.
- Authenticated APIs under `/api/constitutional-adaptation-validator/*`.

## API Surface

- `GET /api/constitutional-adaptation-validator/contract`
- `POST /api/constitutional-adaptation-validator/validate`
- `POST /api/constitutional-adaptation-validator/principles`
- `POST /api/constitutional-adaptation-validator/rules`
- `POST /api/constitutional-adaptation-validator/conflicts`
- `POST /api/constitutional-adaptation-validator/violations`
- `POST /api/constitutional-adaptation-validator/rejection`
- `POST /api/constitutional-adaptation-validator/ledger`
- `POST /api/constitutional-adaptation-validator/replay`
- `GET|POST /api/constitutional-adaptation-validator/inspect`

## Validation States

- `COMPLIANT`
- `COMPLIANT_WITH_REVIEW`
- `REQUIRES_CONSTITUTIONAL_REVIEW`
- `CONSTITUTIONAL_CONFLICT`
- `RESTRICTED`
- `REJECTED`
- `FAIL_CLOSED`

## Certification Notes

- Constitutional compliance requires all protected guarantees to remain intact.
- Governance approval cannot override constitutional rejection.
- Prohibited adaptations are automatically rejected deterministically.
- Replay compares deterministic validation and integrity hashes.
