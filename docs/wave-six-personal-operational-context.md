# Wave 6.3 Personal Operational Context

W6.3 establishes the Personal Operational Context (POC) as the authoritative mutable runtime context layer for Proprium. It tracks active goals, active projects, routines, schedules, temporary priorities, working context, immutable snapshots, and no-overwrite context history.

POC is operational only. It does not own constitutional policy, authority decisions, trust standing, restriction evaluation, identity, or long-term memory. Those remain in the Personal Constitutional Core and upstream constitutional services.

## Runtime Contract

- `types/wave-six-personal-operational-context.ts` defines the doctrine, result, section, readiness, and validation contract.
- `services/wave-six-personal-operational-context/index.ts` builds deterministic POC state from W6.2 dependency coordination and W5.2 unified personal context.
- `app/api/wave-six-personal-operational-context/*` exposes authenticated contract, validation, context manager, goals/projects, routines/schedules/priorities, working snapshot/history, constitutional boundary, and readiness routes.

## Qualification Rules

- Deterministic context assembly is mandatory.
- Hidden AI memory is prohibited.
- Goals, projects, routines, schedules, priorities, and working context are mutable operational state only.
- Snapshots are immutable and replayable.
- Context history is append-only and cannot overwrite prior operational state.
- PCC separation is a hard qualification boundary.

## Exit Evidence

The unit suite verifies doctrine publication, deterministic replay, upstream consumption, operational context assembly, goals/projects, routines/schedules/priorities, working snapshots/history, PCC separation, conditional degradation, and hard constitutional failures.
