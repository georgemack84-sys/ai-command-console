# Program 3 - CAF Legion Behavioral Replay and Divergence Analysis

Status: behavioral replay baseline

Program: Program 3 - Civitas Agent Framework

Phase: P3.11 - Agent Behavioral Replay and Divergence Analysis

Dependencies:

- [Program 3 - CAF Legion Agent Identity and Lifecycle](./program-3-caf-legion-agent-identity-lifecycle.md)
- [Program 3 - CAF Legion Capability Composition and Skill Architecture](./program-3-caf-legion-capability-composition-skill-architecture.md)
- [Program 3 - CAF Legion Agent Runtime Orchestration](./program-3-caf-legion-agent-runtime-orchestration.md)
- [Program 3 - CAF Legion Agent Memory and Knowledge](./program-3-caf-legion-agent-memory-knowledge.md)
- [Program 3 - CAF Legion Planning and Reasoning](./program-3-caf-legion-planning-reasoning.md)
- [Program 3 - CAF Legion Collaboration and Federation](./program-3-caf-legion-collaboration-federation.md)
- [Program 3 - CAF Legion Governance, Authority and Policy Enforcement](./program-3-caf-legion-governance-authority-policy-enforcement.md)
- [Program 3 - CAF Legion Safety and Behavioral Constraints](./program-3-caf-legion-safety-behavioral-constraints.md)
- [Program 3 - CAF Legion Human and Operator Interaction](./program-3-caf-legion-human-operator-interaction.md)
- [Program 3 - CAF Legion Observability and Telemetry](./program-3-caf-legion-observability-telemetry.md)

## Purpose

P3.11 establishes CAF behavioral replay orchestration, behavioral reconstruction, divergence analysis, replay evidence, divergence reporting, and replay qualification support.

P3.11 consumes CCI Replay Infrastructure. It does not implement replay infrastructure, deterministic replay algorithms, event reconstruction, replay persistence, replay scheduling, or replay storage.

## Lifecycle

```text
Replay Requested
  -> CCI Replay Executed
  -> Replay Context Assembled
  -> Behavior Reconstructed
  -> Behavior Compared
  -> Divergence Analysis
  -> Evidence Generated
  -> Report Produced
  -> Replay Complete
```

## Divergence Categories

P3.11 recognizes `NONE`, `DECISION`, `REASONING`, `PLANNING`, `MEMORY`, `COLLABORATION`, `GOVERNANCE`, `AUTHORITY`, `POLICY`, `SAFETY`, `OPERATOR_INTERACTION`, `EXECUTION_ORDER`, `OUTCOME`, `EXTERNAL_DEPENDENCY`, and `UNEXPLAINED`. Unknown divergence categories are treated as `UNEXPLAINED`.

## Implementation Surface

The repository exposes the P3.11 baseline through:

- `types/caf-behavioral-replay-divergence.ts`
- `services/caf-behavioral-replay-divergence/index.ts`
- `app/api/caf-behavioral-replay-divergence/contract`
- `app/api/caf-behavioral-replay-divergence/context`
- `app/api/caf-behavioral-replay-divergence/reconstruction`
- `app/api/caf-behavioral-replay-divergence/comparison`
- `app/api/caf-behavioral-replay-divergence/divergence`
- `app/api/caf-behavioral-replay-divergence/evidence`
- `app/api/caf-behavioral-replay-divergence/report`
- `app/api/caf-behavioral-replay-divergence/certification`
- `app/api/caf-behavioral-replay-divergence/validate`

## Exit Criteria

P3.11 is complete when behavioral replay orchestration is implemented, replay context assembly is deterministic, behavioral reconstruction is complete, comparison validates replayed behavior, divergence analysis is complete, replay evidence is generated, divergence reports are reproducible, CCI replay infrastructure is consumed without duplication, replay lineage is complete, and ownership boundaries are enforced.
