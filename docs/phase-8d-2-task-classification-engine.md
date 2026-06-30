# Phase 8D.2 - Task Classification Engine

## Purpose

The Task Classification Engine determines who should perform each planned task without executing the work. It evaluates delegation contracts against deterministic rules for authority, capability, dependencies, governance, policy, constitutional boundaries, replay, lineage, and confidence.

## Categories

- `OPERATOR`: human judgment, approval, governance review, constitutional interpretation, risk acceptance, or manual intervention
- `AGENT`: certified and authorized Mission Control agent or deterministic autonomy engine
- `EXTERNAL`: approved outside API, enterprise system, cloud service, partner, or infrastructure route
- `DEFERRED`: prerequisites, approvals, resources, schedules, or governance review are incomplete
- `BLOCKED`: authority, policy, governance, constitutional, tenant, or integrity failure prevents execution

## Engine Outputs

- Rule library
- Decision matrix
- Classification decision
- Evaluation evidence
- Authority validation summary
- Policy references
- Dependency analysis
- Confidence score and level
- Governance outcome and alerts
- Replay result
- Visibility surface

## API Surface

- `GET /api/task-classification-engine/contract`
- `POST /api/task-classification-engine/classify`
- `POST /api/task-classification-engine/package`
- `GET /api/task-classification-engine/rules`
- `GET /api/task-classification-engine/matrix`
- `GET /api/task-classification-engine/inspect`
- `POST /api/task-classification-engine/inspect`

## Success Criteria

Phase 8D.2 is complete when every task is classified into exactly one execution category, classification decisions are deterministic and explainable, blocked tasks cannot execute, deferred tasks preserve state, low-confidence decisions require governance review, and replay reconstructs the same classification evidence and owner decision.
