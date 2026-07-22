# Program 3 - CAF Legion Consumer Adoption and Migration

Status: consumer adoption baseline

Program: Program 3 - Civitas Agent Framework

Phase: P3.17 - Consumer Adoption and Migration

## Purpose

P3.17 governs controlled consumer adoption of CAF after platform certification. It plans migrations, validates consumer readiness and compatibility, governs rollout authorization, manages transition records, validates rollback readiness, preserves migration evidence, and generates adoption reports.

P3.17 does not own platform certification, SDK certification, runtime deployment, operational governance, or platform assurance.

## Lifecycle

```text
Migration Planned
  -> Consumer Readiness Verified
  -> Compatibility Validated
  -> Governance Approval
  -> Rollout Authorized
  -> Migration Executed
  -> Transition Stabilized
  -> Migration Completed
```

No migration may bypass any lifecycle stage.

## Implementation Surface

The repository exposes the P3.17 baseline through:

- `types/caf-consumer-adoption-migration.ts`
- `services/caf-consumer-adoption-migration/index.ts`
- `app/api/caf-consumer-adoption-migration/contract`
- `app/api/caf-consumer-adoption-migration/plan`
- `app/api/caf-consumer-adoption-migration/readiness`
- `app/api/caf-consumer-adoption-migration/compatibility`
- `app/api/caf-consumer-adoption-migration/governance`
- `app/api/caf-consumer-adoption-migration/rollout`
- `app/api/caf-consumer-adoption-migration/transition`
- `app/api/caf-consumer-adoption-migration/evidence`
- `app/api/caf-consumer-adoption-migration/reports`
- `app/api/caf-consumer-adoption-migration/certification`
- `app/api/caf-consumer-adoption-migration/validate`

## Exit Criteria

P3.17 is complete when migration planning is implemented, adoption governance is operational, compatibility verification is deterministic, rollout governance supports controlled deployments, transition management preserves continuity, rollback governance is validated, migration evidence is immutable and complete, adoption reporting provides operational visibility, lifecycle transitions are deterministic, and constitutional governance is enforced throughout consumer adoption.
