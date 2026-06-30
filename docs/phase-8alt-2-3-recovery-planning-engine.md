# Phase 8ALT.2.3 - Recovery Planning Engine

## Purpose

Phase 8ALT.2.3 implements the advisory Recovery Planning Engine. It uses Failure Analysis Engine output to generate deterministic, explainable, governance-compliant recovery plans and rank the safest operator-reviewed path.

The engine never executes recovery actions. It does not rollback, restart, restore checkpoints, modify governance or constitutional rules, elevate authority, bypass approval, alter history, access cross-tenant recovery data, or conceal alternatives.

## Implementation

- `types/recovery-planning-engine.ts` defines strategy types, lifecycle states, plan schemas, evaluation records, replay metadata, repository entries, validation results, and observability surfaces.
- `services/recovery-planning-engine/index.ts` generates rollback, restart, checkpoint recovery, staged recovery, dependency repair, alternative execution, and partial continuation plans from deterministic failure analysis inputs.
- `app/api/recovery-planning-engine/*` exposes authenticated contract, plan generation, validation, evaluation, ranking, and replay routes.
- `tests/unit/recovery-planning-engine/recoveryPlanningEngine.test.ts` verifies deterministic strategy generation, scoring, ranking, replay, lineage, integrity, governance, authority, operator approval, tenant isolation, and advisory-only constraints.

## Strategy Families

- Rollback
- Restart
- Checkpoint recovery
- Staged recovery
- Dependency repair
- Alternative execution path
- Partial continuation

## Evaluation and Ranking

Every generated plan is evaluated on recovery confidence, recovery cost, governance impact, replay consistency, operational risk, mission preservation, dependency stability, and duration. Ranking is deterministic and uses the canonical factors from the phase brief.

## Validation Guarantees

- All strategy families are generated deterministically.
- Plans are immutable, replay-compatible, and linked to failure analysis and recovery contract references.
- Governance, constitutional, and authority validation are enforced for every plan.
- Operator approval remains mandatory.
- Replay metadata regenerates identical recovery plans from identical inputs.
- Tenant isolation is enforced.
- Autonomous execution, rollback execution, restart execution, checkpoint restoration, governance mutation, authority escalation, hidden alternatives, replay mismatch, low confidence, and integrity failure fail closed.

## Verification

Run:

```bash
npx vitest run tests/unit/recovery-planning-engine
npm run typecheck
```
