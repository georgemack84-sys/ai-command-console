# Workstream 2 Runtime Orchestrator

Phase W2.10 establishes the CAF Runtime Orchestrator as the governed execution-control layer that transforms approved plans, context, restrictions, tasks, checkpoints, and recovery controls into deterministic runtime execution.

## Qualified Baseline

- Phase: `runtime-orchestrator/w2.10`
- Readiness identifier: `W2.10-RUNTIME-ORCHESTRATOR-READINESS-001`
- Qualification gate: `Runtime Orchestrator Qualification Gate`
- Passing decision: `QUALIFIED`
- Upstream anchors: W2.0 through W2.9

## Contract Surface

- `types/runtime-orchestrator.ts` defines runtime decisions, states, dispositions, restriction outcomes, failure modes, control plane, context assembly, adapter, restrictions, tasks, checkpoints, recovery, APIs, evidence, readiness, validation, and bundle metadata.
- `services/runtime-orchestrator/index.ts` provides deterministic run, validate, replay, and bundle operations.
- `app/api/runtime-orchestrator/*` exposes authenticated contract, validation, control-plane, context, adapter, restrictions, tasks, checkpoints, recovery, APIs, evidence, and readiness slices.

## Governance Guarantees

- Runtime lifecycle authority remains owned by W2.2.
- Runtime execution remains subordinate to constitution, lifecycle, authority, policy, safety, operator controls, and runtime restrictions.
- Context assembly is deterministic, minimized, provenance-aware, integrity protected, and tenant/namespace isolated.
- Reasoning runtime adapters are provider-neutral and cannot add capabilities, tools, data access, approvals, or hidden provider behavior.
- Runtime restrictions compose upstream decisions and may only stay equal or become more restrictive without new approval.
- Tasks require valid runtime state, plan version, dependency completion, refreshed governance decisions, side-effect controls, idempotency, validation, checkpoints, and evidence.
- Checkpoints are immutable, version-aware, integrity protected, and deterministic for resume.
- Recovery cannot revive revoked runtimes, reuse invalid decisions, duplicate side effects, or alter historical evidence.
- Runtime APIs are versioned, authenticated, authorized, idempotent, structured, and evidence-linked.

## Verification

The W2.10 unit suite validates qualification, deterministic replay, upstream anchoring, lifecycle control, context assembly, adapter isolation, restriction precedence, task execution controls, checkpoints, recovery, APIs, evidence, conditional degradation, fail-closed behavior, explicit qualification failure, and observation/follow-up outcomes.
