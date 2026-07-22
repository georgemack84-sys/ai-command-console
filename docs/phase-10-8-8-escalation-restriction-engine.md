# Phase 10.8.8 - Escalation & Restriction Engine

The Escalation & Restriction Engine is the governed routing authority for the Governance-Aware Adaptation Layer. It evaluates all preceding validation outputs and determines the mandatory review path, escalation requirements, operational restrictions, reviewer assignments, approval gates, and simulation authorization state before an adaptive proposal can advance.

## Tightened Prompt

Aggregate governance, constitutional, authority, tenant isolation, policy conflict, ledger, evidence, certification, replay, and audit results into a deterministic decision context. Evaluate mandatory escalation rules, apply least-authority restrictions, assign reviewers, construct a blocking review workflow, enforce progression gates, and record the final routing decision for replay and audit.

The engine must remain constitution-first, governance-driven, deterministic, explainable, replayable, evidence-backed, advisory-only, human-controlled, fail-closed, tenant-isolated, immutable, audit-ready, lineage-preserving, and least-authority by default. It never authorizes execution and never overrides governance decisions; it only determines the required governance path.

## Implemented Scope

- Typed engine contract in `types/escalation-restriction-engine.ts`.
- Deterministic service in `services/escalation-restriction-engine`.
- Required `EscalationRestrictionDecision` object with validation summary, escalation triggers, escalation level, reviewer assignments, review workflow, restrictions, dependencies, approvals, simulation authorization, final decision, reasoning, evidence, replay reference, timestamp, and integrity hash.
- Validation context aggregation across Modules 10.8.1 through 10.8.7.
- Escalation trigger analysis across constitutional, governance, authority, operator, audit, replay, evidence, certification, compliance, risk, tenant isolation, security, privacy, trust, documentation, rollback, simulation, production readiness, operational impact, and executive oversight categories.
- Restriction enforcement for advisory-only, simulation-only, additional approval, restricted domain, temporary, permanent, and prohibited states.
- Reviewer assignment matrix and blocking review workflow.
- Immutable escalation restriction ledger entry for replay and audit.
- Authenticated APIs under `/api/escalation-restriction-engine/*`.

## API Surface

- `GET /api/escalation-restriction-engine/contract`
- `POST /api/escalation-restriction-engine/determine`
- `POST /api/escalation-restriction-engine/context`
- `POST /api/escalation-restriction-engine/triggers`
- `POST /api/escalation-restriction-engine/restrictions`
- `POST /api/escalation-restriction-engine/workflow`
- `POST /api/escalation-restriction-engine/reviewers`
- `POST /api/escalation-restriction-engine/enforcement`
- `POST /api/escalation-restriction-engine/ledger`
- `POST /api/escalation-restriction-engine/replay`
- `POST /api/escalation-restriction-engine/inspect`

## Decision States

- `APPROVED_FOR_SIMULATION`
- `OPERATOR_REVIEW_REQUIRED`
- `GOVERNANCE_REVIEW_REQUIRED`
- `CONSTITUTIONAL_REVIEW_REQUIRED`
- `MULTI_LEVEL_REVIEW_REQUIRED`
- `RESTRICTED`
- `REJECTED`
- `FAIL_CLOSED`

## Fail-Closed Conditions

- Escalation rules cannot be evaluated
- Review authority cannot be determined
- Mandatory reviewer assignment is ambiguous
- Constitutional impact remains unresolved
- Governance modification lacks required approval
- Authority expansion is detected
- Policy conflicts remain unresolved
- Audit degradation is unmitigated
- Replay degradation is unresolved
- Tenant isolation risk remains unresolved
- Operator visibility is reduced
- Restriction enforcement fails
- Review workflow is nondeterministic
- Validation reasoning is nondeterministic
- Replay divergence occurs
- Integrity verification fails
- Escalation decision recording fails

## Certification Notes

- `APPROVED_FOR_SIMULATION` is emitted only when all upstream validations are complete and no mandatory escalation remains.
- Any unresolved escalation risk returns `FAIL_CLOSED`.
- The engine may authorize simulation readiness, but it never authorizes execution or implementation.
- Replay compares deterministic decision output and integrity hashes.
