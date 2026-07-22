# Workstream 2 Delegation Engine

Phase W2.11 establishes constitutional delegation for CAF Legion. Delegation is deterministic, auditable, revocable, monitored, tenant-isolated, and incapable of exceeding authority, policy, safety, runtime, or operator constraints.

## Operational Baseline

- Phase: `delegation-engine/w2.11`
- Readiness identifier: `W2.11-DELEGATION-ENGINE-READINESS-001`
- Operational gate: `Delegation Engine Operational Gate`
- Passing decision: `DELEGATION_ENGINE_OPERATIONAL`
- Upstream anchors: W2.0 through W2.10

## Contract Surface

- `types/delegation-engine.ts` defines delegation decisions, lifecycle states, failure modes, contracts, authority intersection, lifecycle, revocation, monitoring, lineage, governance, runtime integration, APIs, evidence, readiness, validation, and bundle metadata.
- `services/delegation-engine/index.ts` provides deterministic run, validate, replay, and bundle operations.
- `app/api/delegation-engine/*` exposes authenticated contract, validation, contracts, authority-intersection, lifecycle, revocation, monitoring, lineage, governance, runtime-integration, APIs, evidence, and readiness slices.

## Governance Guarantees

- Delegated authority is computed as the minimum constitutional authority.
- Delegation cannot elevate authority, bypass policy, bypass safety, bypass runtime restrictions, or cross tenant boundaries.
- Revocation is immediate, cascading, auditable, and removes delegated authority.
- Monitoring detects authority drift, expirations, policy and safety violations, runtime violations, and excessive delegation depth.
- Lineage is immutable and replayable across delegation chains.
- Runtime enforcement validates every delegated action before execution.

## Verification

The W2.11 unit suite validates operational readiness, deterministic replay, upstream anchoring, contracts, authority intersection, lifecycle, revocation, monitoring, lineage, governance, runtime enforcement, APIs, evidence, conditional degradation, fail-closed behavior, explicit gate failure, and observation/follow-up outcomes.
