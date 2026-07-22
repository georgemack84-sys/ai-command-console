# MC-7 — Simulation

The Simulation Platform provides deterministic operational simulation for Mission Control. It consumes the MC-6 Digital Twin as the authoritative operational model and produces evidence-backed forecasts without modifying live mission state.

## Constitutional Scope

- Owns deterministic simulation runtime, mission simulation, operational forecasting, decision impact simulation, resource simulation, risk simulation, scenario execution, predictive analytics, evidence, reports, and APIs.
- Consumes MC-1 Mission Management, MC-2 Scenario Planning, MC-3 Decision Support, MC-5 Replay, and MC-6 Digital Twin.
- Rejects non-deterministic simulations, live mission mutation, forecasts without confidence or justification, mutable evidence, and failed replay validation.

## Runtime Contract

- `types/simulation.ts` defines the MC-7 simulation constitution.
- `services/simulation/index.ts` implements deterministic simulation assembly, validation, replay hashing, integrity hashing, and bundle publication.
- `app/api/simulation/*` exposes authenticated route slices for contract, validation, engine, mission simulation, forecasting, impact, resources, risk, scenarios, analytics, evidence, reports, APIs, and readiness.

## Verification

Run the focused MC-7 suite:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/simulation/simulation.test.ts
```

Run a scoped typecheck for the MC-7 type, service, and API routes, then run the cumulative W1/W2/MC chain through `tests/unit/simulation/simulation.test.ts`.
