# Phase 7G.1 - Governance Lineage Contract

Phase 7G.1 defines the immutable, deterministic, replayable contract for Governance Lineage Intelligence. It makes every governance conclusion explainable through explicit policy, constitutional, authority, evidence, risk, compliance, recommendation, and escalation references.

## Delivered Surface

- `types/governance-lineage.ts` defines lineage identity, object classification, references, influence chains, confidence, replay metadata, explanation metadata, state transitions, validation, replay, and observability.
- `services/governance-lineage/index.ts` implements deterministic lineage registration, validation, state transition checks, replay verification, influence resolution, explanation, and contract observability.
- `app/api/governance-lineage/*` exposes contract, register, validate, replay, hash, inspect, resolve, explain, and retrieve endpoints.
- `tests/unit/governance-lineage/governanceLineage.test.ts` certifies contract compliance and fail-closed behavior.

## Contract Guarantees

- Governance lineage IDs are deterministic and tenant-scoped.
- Immutable fields include lineage id, tenant id, mission id, root lineage id, and created timestamp.
- Supported lineage types are `POLICY`, `CONSTITUTION`, `AUTHORITY`, `EVIDENCE`, `RISK`, `COMPLIANCE`, `RECOMMENDATION`, `ESCALATION`, `DECISION`, and `GOVERNANCE`.
- Influence chains explicitly record source type, source identifier, relationship, weight, confidence, and reason.
- Replay metadata reconstructs deterministic lineage hashes.
- Explanation metadata is operator-visible.
- State transitions are forward-only.
- Hidden influence, missing references, tenant leaks, invalid transitions, immutable mutations, duplicate ids, and hash mismatches fail closed.

## API Surface

- `registerGovernanceLineage()`
- `validateGovernanceLineage()`
- `getGovernanceLineage()`
- `resolveInfluenceChain()`
- `verifyGovernanceReplay()`
- `explainGovernanceConclusion()`

## Certification Readiness

This contract is ready to support:

- 7G.2 Policy Lineage Reconstruction
- 7G.3 Decision Influence Analysis
- 7G.4 Governance Explainability Engine
- 7G.5 Lineage Certification Gate
