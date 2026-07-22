# Program 3 - CAF Legion Platform Assurance

Status: assurance baseline

Program: Program 3 - Civitas Agent Framework

Phase: P3.14 - Platform Assurance

Dependencies:

- P3.1 through P3.13 Program 3 phase outputs.
- P3.11 Agent Behavioral Replay and Divergence Analysis replay evidence.

## Purpose

P3.14 establishes the constitutional assurance layer for CAF. It aggregates assurance evidence, verifies dependencies, validates governance and evidence integrity, consumes replay evidence, correlates evidence, and produces assurance decisions and qualification evidence.

P3.14 does not execute replay, reconstruct replay sessions, generate replay evidence, authorize execution, modify evidence, or certify the platform. Certification remains the responsibility of the subsequent certification phase.

## Workflow

```text
Evidence Collection
  -> Dependency Verification
  -> Governance Verification
  -> Evidence Verification
  -> Replay Evidence Consumption
  -> Evidence Correlation
  -> Assurance Aggregation
  -> Qualification Decision
  -> Assurance Report
```

## Implementation Surface

The repository exposes the P3.14 baseline through:

- `types/caf-platform-assurance.ts`
- `services/caf-platform-assurance/index.ts`
- `app/api/caf-platform-assurance/contract`
- `app/api/caf-platform-assurance/package`
- `app/api/caf-platform-assurance/dependencies`
- `app/api/caf-platform-assurance/governance`
- `app/api/caf-platform-assurance/evidence`
- `app/api/caf-platform-assurance/replay`
- `app/api/caf-platform-assurance/decision`
- `app/api/caf-platform-assurance/report`
- `app/api/caf-platform-assurance/certification`
- `app/api/caf-platform-assurance/validate`

## Exit Criteria

P3.14 is complete when assurance aggregation is complete, dependency verification passes, governance and evidence verification complete, P3.11 replay evidence is consumed and validated without replay execution, assurance reports are generated, qualification evidence is complete, assurance decisions are produced, findings trace to immutable evidence, constitutional boundaries are enforced, and the phase is ready to provide assurance outputs to Program 3 certification.
