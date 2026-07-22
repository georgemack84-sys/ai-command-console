# Workstream 2 Authority Validator

Phase W2.5 establishes the CAF Authority Validator as the deterministic authority gate for agents, operators, services, workflows, delegated actors, capabilities, and skills. It preserves the platform enforcement sequence: `Authority -> Policy -> Safety -> Operator`.

## Operational Baseline

- Phase: `authority-validator/w2.5`
- Readiness identifier: `W2.5-AUTHORITY-VALIDATOR-READINESS-001`
- Operational gate: `Authority Validator Operational Gate`
- Passing decision: `AUTHORITY_VALIDATOR_OPERATIONAL`
- Upstream anchors: W2.0 CAF Constitutional Foundation, W2.1 Agent Registry, W2.2 Lifecycle Engine, W2.3 Capability Registry, W2.4 Skill Registry

## Contract Surface

- `types/authority-validator.ts` defines authority validator decisions, dispositions, profile kinds, delegation kinds, failure modes, subsystem records, readiness, validation, and bundle metadata.
- `services/authority-validator/index.ts` provides deterministic run, validate, replay, and bundle operations.
- `app/api/authority-validator/*` exposes authenticated contract, validation, profiles, delegation, evaluation, restrictions, disposition mapping, registry, decisions, APIs, evidence, and readiness slices.

## Governance Guarantees

- Authority profiles cover agent, operator, tenant, organization, runtime, service, workflow, capability, skill, and administrative authority.
- Delegation is scoped, time-bound or permanent as declared, revocable, evidence-backed, approval-linked, and constitutionally constrained.
- Evaluation considers requester, authority profile, delegation, capability ownership, skill ownership, lifecycle, tenant boundary, namespace, constitutional constraints, runtime eligibility, certification, and conflicts.
- Restrictions are evaluated before execution authorization and include tenant, organization, jurisdiction, capability, skill, lifecycle, runtime, certification, policy, and safety prerequisites.
- Dispositions are standardized as `AUTHORIZED`, `AUTHORIZED_WITH_RESTRICTIONS`, `DELEGATED`, `DENIED`, `REQUIRES_OPERATOR`, `REQUIRES_POLICY`, `REQUIRES_CERTIFICATION`, `SUSPENDED`, `REVOKED`, and `UNKNOWN`, with unknown dispositions rejected for execution.
- Decisions and evidence are deterministic, immutable, replayable, and bound to registry history.

## Verification

The W2.5 unit suite validates the operational baseline, deterministic replay, upstream anchoring, profiles, delegation, evaluation, restriction enforcement, disposition mapping, decision production, APIs, immutable evidence, conditional degradation, fail-closed behavior, explicit gate failure, and observation/follow-up outcomes.
