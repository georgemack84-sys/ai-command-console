# Program 6 P6.5 Simulation Framework

Phase P6.5 establishes deterministic, isolated proving-ground simulation execution.

## Scope Owned

- deterministic simulation
- event simulation
- operational simulation
- mission simulation
- replay simulation
- simulation reports
- simulation evidence

## Boundary

P6.5 never performs live operational execution and never modifies production tenants, identities, registries, evidence, or trust decisions.

## Verification Gates

- `P6.5-GATE-001`: Deterministic Execution
- `P6.5-GATE-002`: Replay Fidelity
- `P6.5-GATE-003`: Simulation Isolation
- `P6.5-GATE-004`: Evidence Completeness
- `P6.5-GATE-005`: Time Determinism
- `P6.5-GATE-006`: State Recovery

## API Routes

- `GET /api/proving-simulation-framework/contract`
- `POST /api/proving-simulation-framework/validate`
- `GET|POST /api/proving-simulation-framework/architecture`
- `GET|POST /api/proving-simulation-framework/engine`
- `GET|POST /api/proving-simulation-framework/events`
- `GET|POST /api/proving-simulation-framework/operational`
- `GET|POST /api/proving-simulation-framework/mission`
- `GET|POST /api/proving-simulation-framework/replay`
- `GET|POST /api/proving-simulation-framework/time`
- `GET|POST /api/proving-simulation-framework/scheduler`
- `GET|POST /api/proving-simulation-framework/state`
- `GET|POST /api/proving-simulation-framework/failure-injection`
- `GET|POST /api/proving-simulation-framework/metrics`
- `GET|POST /api/proving-simulation-framework/reports`
- `GET|POST /api/proving-simulation-framework/evidence`
- `GET|POST /api/proving-simulation-framework/readiness`
