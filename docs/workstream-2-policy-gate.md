# Workstream 2 Policy Gate

Phase W2.6 establishes the CAF Policy Gate as the deterministic policy enforcement stage that consumes validated authority decisions and produces canonical policy dispositions for the downstream Safety Gate.

## Certified Baseline

- Phase: `policy-gate/w2.6`
- Readiness identifier: `W2.6-POLICY-GATE-READINESS-001`
- Certification gate: `Policy Gate Certification Gate`
- Passing decision: `POLICY_GATE_CERTIFIED`
- Enforcement sequence: `Authority -> Policy -> Safety -> Operator`
- Upstream anchors: W2.0 CAF Constitutional Foundation, W2.1 Agent Registry, W2.2 Lifecycle Engine, W2.3 Capability Registry, W2.4 Skill Registry, W2.5 Authority Validator

## Contract Surface

- `types/policy-gate.ts` defines policy gate decisions, dispositions, scopes, failure modes, subsystem records, readiness, validation, and bundle metadata.
- `services/policy-gate/index.ts` provides deterministic run, validate, replay, and bundle operations.
- `app/api/policy-gate/*` exposes authenticated contract, validation, engine, registry, resolution, hierarchy, conflicts, exceptions, disposition mapping, decisions, APIs, evidence, and readiness slices.

## Governance Guarantees

- Policy consumes validated authority decisions and never grants authority independently.
- Policy does not evaluate safety, perform operator approval, authenticate identities, or execute actions.
- Resolution covers inheritance, aggregation, overrides, exclusions, conditional activation, and runtime policy activation.
- Precedence is canonical: Constitutional, Platform, Regulatory, Organization, Tenant, Mission, Runtime, Capability, Skill, Session.
- Conflict detection covers incompatible permissions, conflicting restrictions, circular dependencies, duplicate policies, invalid inheritance, and impossible conditions.
- Exception workflows require approval, evidence, lineage, expiration, and revocation.
- Dispositions are standardized as `ALLOW`, `ALLOW_WITH_RESTRICTIONS`, `DENY`, `ESCALATE`, and `FAIL_CLOSED`.
- Evidence is immutable, replayable, traceable to authority, and ready for downstream Safety Gate evaluation.

## Verification

The W2.6 unit suite validates certification, deterministic replay, upstream anchoring, policy evaluation, registry integration, hierarchy, resolution, conflict detection, exceptions, dispositions, policy boundaries, APIs, immutable evidence, conditional degradation, fail-closed behavior, explicit certification failure, and observation/follow-up outcomes.
