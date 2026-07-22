# Wave 6.6 Operational State and Disposition Management

W6.6 establishes the authoritative lifecycle layer for Wave 6 orchestration requests. It owns request state, terminal disposition recording, transition validation, operational lineage, lifecycle evidence, replay metadata, request registry, disposition registry, and lifecycle reports.

The phase enforces exactly one lifecycle per request, exactly one current operational state, and exactly one immutable terminal disposition for completed requests. Dispositions are never runtime states.

## Runtime Contract

- `types/wave-six-operational-state-disposition-management.ts` defines lifecycle, state/disposition, lineage, evidence, replay, reporting, boundary, readiness, and validation contracts.
- `services/wave-six-operational-state-disposition-management/index.ts` consumes W6.1, W6.2, W6.3, and W6.5 to produce deterministic lifecycle governance evidence.
- `app/api/wave-six-operational-state-disposition-management/*` exposes authenticated contract, validation, lifecycle manager, state/disposition model, transition/lineage evidence, replay/reporting, ownership boundary, and readiness routes.

## Qualification Rules

- Every request has exactly one deterministic lifecycle.
- Every request has exactly one active operational state.
- Every completed request records exactly one immutable terminal disposition.
- Invalid lifecycle transitions fail closed.
- Lifecycle history and transition evidence are immutable.
- Operational lineage supports deterministic replay.
- Lifecycle management remains independent of provider execution, scheduling, trust decisions, human approval, mission execution, and constitutional policy.

## Exit Evidence

The unit suite verifies doctrine publication, deterministic replay, W6.1/W6.2/W6.3/W6.5 consumption, state/disposition separation, fail-closed transition validation, immutable lineage, lifecycle evidence, replay/reporting, ownership boundaries, conditional degradation, and hard constitutional failures.
