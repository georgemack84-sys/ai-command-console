# Program 3 - CAF Legion Planning and Reasoning

Status: planning and reasoning baseline

Program: Program 3 - Civitas Agent Framework Legion

Phase: P3.5 - Planning and Reasoning

Predecessors:

- [Program 3 - CAF Legion Constitutional Foundation](./program-3-caf-legion-constitutional-foundation.md)
- [Program 3 - CAF Legion Agent Memory and Knowledge](./program-3-caf-legion-agent-memory-knowledge.md)

## Purpose

P3.5 establishes governed planning and reasoning capabilities used by CAF agents to interpret objectives, decompose work, evaluate alternatives, construct candidate plans, and generate bounded recommendations.

P3.5 is advisory-only. It does not authorize execution, approve its own plans, alter governance, expand scope, grant capabilities, or create objectives without governed qualification.

## Scope

P3.5 defines:

- Objective intake, qualification, and synthesis.
- Goal graph architecture.
- Bounded decomposition.
- Reasoning pipeline framework.
- Candidate plan generation.
- Assumption and uncertainty handling.
- Advisory recommendation synthesis.
- Planning governance and safety controls.
- Planning evidence and replay.
- Operator observability and controls.

## Advisory Boundary

Planning may produce interpretations, decompositions, candidate plans, alternatives, risk observations, confidence assessments, recommendations, clarification requests, and review requests.

Planning may not execute plans, self-approve, grant capabilities, bypass governance, silently expand objectives, conceal uncertainty, or treat recommendations as authorization.

## Implementation Surface

The repository exposes the P3.5 baseline through:

- `types/caf-planning-reasoning.ts`
- `services/caf-planning-reasoning/index.ts`
- `app/api/caf-planning-reasoning/contract`
- `app/api/caf-planning-reasoning/objectives`
- `app/api/caf-planning-reasoning/goals`
- `app/api/caf-planning-reasoning/plans`
- `app/api/caf-planning-reasoning/evidence`
- `app/api/caf-planning-reasoning/certification`
- `app/api/caf-planning-reasoning/validate`

## Exit Criteria

P3.5 is complete when objectives are qualified before planning, goal graphs are canonical and cycle-safe, decomposition preserves scope and constraints, plan steps map to registered capabilities, assumptions and uncertainty are explicit, recommendations remain advisory-only, evidence is immutable, replay is deterministic, tenant isolation is preserved, operator controls are effective, and no planning component can authorize execution.
