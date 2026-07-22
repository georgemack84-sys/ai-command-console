# Program 3 - CAF Legion Safety and Behavioral Constraints

Status: safety enforcement baseline

Program: Program 3 - Civitas Agent Framework

Phase: P3.8 - Safety and Behavioral Constraints

Predecessors:

- [Program 3 - CAF Legion Agent Runtime Orchestration](./program-3-caf-legion-agent-runtime-orchestration.md)
- [Program 3 - CAF Legion Agent Memory and Knowledge](./program-3-caf-legion-agent-memory-knowledge.md)
- [Program 3 - CAF Legion Planning and Reasoning](./program-3-caf-legion-planning-reasoning.md)
- [Program 3 - CAF Legion Collaboration and Federation](./program-3-caf-legion-collaboration-federation.md)
- [Program 3 - CAF Legion Governance, Authority and Policy Enforcement](./program-3-caf-legion-governance-authority-policy-enforcement.md)

## Purpose

P3.8 establishes the constitutional safety framework for every CAF agent. It evaluates behavior before autonomous execution and produces deterministic safety, intervention, containment, automation, exception, evidence, and observability outputs.

P3.8 owns the Safety Gate, Behavioral Constraints, Safety Enforcement, Intervention, Containment, Safety Warning Registry, Automation Eligibility, and Safety Exception Governance. It does not own constitutional authority, policy definition, execution runtime, memory storage, planning, collaboration, or operator identity.

## Pipeline

```text
Behavior Request
  -> Behavior Constraint Evaluation
  -> Safety Rule Evaluation
  -> Risk Assessment
  -> Automation Eligibility
  -> Intervention Decision
  -> Containment Decision
  -> Safety Gate
  -> Safety Evidence
```

## Implementation Surface

The repository exposes the P3.8 baseline through:

- `types/caf-safety-behavioral-constraints.ts`
- `services/caf-safety-behavioral-constraints/index.ts`
- `app/api/caf-safety-behavioral-constraints/contract`
- `app/api/caf-safety-behavioral-constraints/safety`
- `app/api/caf-safety-behavioral-constraints/intervention`
- `app/api/caf-safety-behavioral-constraints/containment`
- `app/api/caf-safety-behavioral-constraints/automation`
- `app/api/caf-safety-behavioral-constraints/warnings`
- `app/api/caf-safety-behavioral-constraints/evidence`
- `app/api/caf-safety-behavioral-constraints/certification`
- `app/api/caf-safety-behavioral-constraints/validate`

## Exit Criteria

P3.8 is complete when behavioral constraints are implemented, the Safety Gate deterministically evaluates execution, enforcement and intervention are reproducible, containment is deterministic, safety warnings are standardized and replayable, automation eligibility is governed, safety exceptions remain constitutionally controlled, evidence is immutable and replayable, observability is complete, and certification passes with deterministic replay.
