# Phase 8A.5 - Constitutional Constraints

## Purpose

The Constitutional Constraints framework enforces immutable constitutional guardrails for every Controlled Autonomy request. It treats the Mission Constitution and Governance Constitution as the highest authorities, above autonomy, policy optimization, runtime conditions, and execution opportunities.

## Implemented Artifacts

- `types/autonomy-constitutional-constraints.ts` defines constitutional requests, rule evaluations, validation results, decision records, ledgers, replay results, visibility surfaces, scenarios, and failure reasons.
- `services/autonomy-constitutional-constraints/index.ts` implements deterministic rule evaluation, constitutional validation, fail-closed decisioning, immutable decision ledgers, replay verification, and visibility.
- `app/api/autonomy-constitutional-constraints/*` exposes authenticated framework, request, decide, validate, ledger, replay, and visibility endpoints.
- `tests/unit/autonomy-constitutional-constraints/autonomyConstitutionalConstraints.test.ts` covers approvals, rejection scenarios, fail-closed undocumented execution, ledgers, replay, integrity mismatch detection, and visibility.

## Rule Coverage

The validator evaluates mission constitution, governance constitution, policy compliance, operator authority, tenant isolation, replay readiness, evidence completeness, audit readiness, and integrity verification in deterministic order.

## Rejection Coverage

The framework rejects unauthorized execution, authority escalation, policy bypass, governance bypass, hidden autonomy, cross-tenant behavior, undocumented execution, self-modification, constitution modification, missing evidence, replay divergence, missing audit records, and integrity mismatch.

## Replay And Visibility

Every constitutional decision records evaluated rules, outcome, denial reason, approving authority, replay reference, evidence references, audit reference, integrity hash, and timestamp. Replay reconstructs rule order, decisions, evidence, and integrity. Visibility exposes evaluated rules, validation results, approval path, denial reasons, policy and governance influence, operator approvals, replay references, evidence chain, integrity status, and audit history.
