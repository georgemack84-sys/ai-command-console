# Workstream 2 Replay Engine

Phase W2.14 establishes constitutional replay for CAF Legion. Replay reconstructs and verifies execution from immutable evidence; it is a verification capability, not an execution engine.

## Qualified Baseline

- Phase: `replay-engine/w2.14`
- Readiness identifier: `W2.14-REPLAY-ENGINE-READINESS-001`
- Qualification gate: `Replay Engine Qualification Gate`
- Passing decision: `REPLAY_ENGINE_QUALIFIED`
- Upstream anchors: W2.9 Memory Engine, W2.10 Runtime Orchestrator, W2.11 Delegation Engine, W2.12 Collaboration Engine, W2.13 Evidence Engine

## Contract Surface

- `types/replay-engine.ts` defines replay decisions, failure modes, runtime replay, decision replay, execution-control replay, divergence detection, APIs, explorer, reports, security, evidence, readiness, validation, and bundle metadata.
- `services/replay-engine/index.ts` provides deterministic run, validate, replay, and bundle operations.
- `app/api/replay-engine/*` exposes authenticated contract, validation, runtime, decisions, execution-control, divergence, APIs, explorer, reports, security, evidence, and readiness slices.

## Governance Guarantees

- Runtime replay reconstructs execution deterministically from evidence packages.
- Decision replay covers planning, memory retrieval, tool invocation, authority, policy, safety, delegation, collaboration, approvals, and restrictions.
- Execution control replay covers tasks, workflows, checkpoints, recovery, suspension, resume, failures, retries, lifecycle, and orchestration.
- Divergence detection compares timeline, decisions, memory, tools, runtime state, events, and evidence with root-cause attribution.
- Replay reports are signed, immutable, audit-ready, and suitable for certification.
