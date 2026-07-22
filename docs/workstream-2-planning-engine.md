# Workstream 2 Planning Engine

Phase W2.8 establishes the CAF Planning Engine as the deterministic constitutional planning layer that converts operator intent into explainable, reviewable, approval-gated, replayable execution plans.

## Qualified Baseline

- Phase: `planning-engine/w2.8`
- Readiness identifier: `W2.8-PLANNING-ENGINE-READINESS-001`
- Qualification gate: `Planning Engine Qualification Gate`
- Passing decision: `PLANNING_ENGINE_QUALIFIED`
- Upstream anchors: W2.0 CAF Constitutional Foundation, W2.1 Agent Registry, W2.2 Lifecycle Engine, W2.3 Capability Registry, W2.4 Skill Registry, W2.5 Authority Validator, W2.6 Policy Gate, W2.7 Safety Gate

## Contract Surface

- `types/planning-engine.ts` defines planning decisions, failure modes, goal decomposition, planning graph, plan generation, constraints, review, approvals, validation, registry, reasoning runtime contract, evidence, readiness, validation, and bundle metadata.
- `services/planning-engine/index.ts` provides deterministic run, validate, replay, and bundle operations.
- `app/api/planning-engine/*` exposes authenticated contract, validation, goal, graph, generation, constraints, review, approvals, validation-engine, registry, reasoning-runtime-contract, evidence, and readiness slices.

## Governance Guarantees

- Planning never violates constitutional constraints and fails closed when integrity cannot be established.
- Goal decomposition is deterministic, repeatable, lineage-preserving, and dependency-validating.
- Planning graphs are validated DAGs with cycles prevented and dependency ordering verified.
- Generated plans include task ordering, capability selection, skill assignment, sequencing, resources, scheduling, alternatives, fallbacks, recovery, and optimization.
- Constraints cover capability, authority, policy, safety, lifecycle, resource, dependency, scheduling, tenant, and environmental dimensions.
- Reviews are reproducible and explainable, and approvals are deterministic, auditable, replayable, and required before execution.
- Plan validation rejects invalid plans and records deterministic readiness evidence.
- The Reasoning Runtime Contract is versioned, backward compatible, replay compatible, and separates planning from execution.
- Planning evidence is immutable, traceable, and replay complete.

## Verification

The W2.8 unit suite validates qualification, deterministic replay, upstream anchoring, goal decomposition, acyclic planning graphs, plan generation, constraint resolution, review, approvals, validation, registry, reasoning runtime contract, evidence, conditional degradation, fail-closed behavior, explicit qualification failure, and observation/follow-up outcomes.
