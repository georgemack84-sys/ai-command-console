# MC-6 — Digital Twin

The Digital Twin is Mission Control's operational projection of missions, portfolios, resources, decisions, dependencies, evidence, operators, and execution lineage. It is not an independent source of truth.

## Constitutional Scope

- Owns digital twin engine, projection engine, state synchronization, twin graph, snapshots, query service, historical reconstruction, divergence detection, visualization projection, evidence generation, APIs, and synchronization reports.
- Consumes MC-1 through MC-5.
- Derives exclusively from immutable CCI Event History through replay. Direct twin mutation, alternate operational databases, synthetic events, and source-of-truth substitution are rejected.

## Runtime Contract

- `types/digital-twin.ts` defines the MC-6 digital twin constitution.
- `services/digital-twin/index.ts` implements deterministic twin assembly, validation, replay hashing, integrity hashing, and bundle publication.
- `app/api/digital-twin/*` exposes authenticated route slices for contract, validation, engine, projection, synchronization, graph, snapshots, query, historical reconstruction, divergence, visualization, evidence, APIs, reports, and readiness.

## Verification

Run the focused MC-6 suite:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/digital-twin/digitalTwin.test.ts
```

Run a scoped typecheck for the MC-6 type, service, and API routes, then run the cumulative W1/W2/MC chain through `tests/unit/digital-twin/digitalTwin.test.ts`.
