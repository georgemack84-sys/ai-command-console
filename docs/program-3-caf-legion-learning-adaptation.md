# Program 3 - CAF Legion Learning and Adaptation

Status: governed learning baseline

Program: Program 3 - Civitas Agent Framework

Phase: P3.12 - Learning and Adaptation

Dependencies:

- [Program 3 - CAF Legion Planning and Reasoning](./program-3-caf-legion-planning-reasoning.md)
- [Program 3 - CAF Legion Governance, Authority and Policy Enforcement](./program-3-caf-legion-governance-authority-policy-enforcement.md)
- [Program 3 - CAF Legion Safety and Behavioral Constraints](./program-3-caf-legion-safety-behavioral-constraints.md)
- [Program 3 - CAF Legion Observability and Telemetry](./program-3-caf-legion-observability-telemetry.md)
- [Program 3 - CAF Legion Behavioral Replay and Divergence Analysis](./program-3-caf-legion-behavioral-replay-divergence.md)

## Purpose

P3.12 implements governed learning and adaptation for CAF. It generates bounded adaptation proposals, qualifies adaptations against governance, replay, safety, evidence, and bounded-improvement requirements, and records approved learning activity with complete lineage.

P3.12 never grants authority to redefine governance, policy, safety constraints, identity, or capabilities outside approved constitutional boundaries. It consumes P3.11 and CCI replay services without implementing replay infrastructure.

## Lifecycle

```text
Behavior observed
  -> Evidence collected
  -> Adaptation proposal generated
  -> Governance validation
  -> Replay validation
  -> Safety validation
  -> Qualification
  -> Approval if required
  -> Activation
  -> Behavior monitored
  -> Evidence accumulated
  -> Future adaptation
```

## Implementation Surface

The repository exposes the P3.12 baseline through:

- `types/caf-learning-adaptation.ts`
- `services/caf-learning-adaptation/index.ts`
- `app/api/caf-learning-adaptation/contract`
- `app/api/caf-learning-adaptation/proposal`
- `app/api/caf-learning-adaptation/assessment`
- `app/api/caf-learning-adaptation/lifecycle`
- `app/api/caf-learning-adaptation/registry`
- `app/api/caf-learning-adaptation/bounded`
- `app/api/caf-learning-adaptation/evidence`
- `app/api/caf-learning-adaptation/governance`
- `app/api/caf-learning-adaptation/certification`
- `app/api/caf-learning-adaptation/validate`

## Exit Criteria

P3.12 is complete when governed adaptation is implemented, lifecycle execution is deterministic, every adaptation produces immutable evidence, improvement is bounded by constitutional constraints, replay validation runs through P3.11 and CCI without duplication, registry lineage is complete, learning is explainable and auditable, authority/policy/safety gates cannot be bypassed, and learning never expands agent authority or modifies constitutional governance.
