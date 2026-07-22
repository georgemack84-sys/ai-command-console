# MC-4 — Portfolio Management

Portfolio Management coordinates many concurrent missions across Mission Control while preserving constitutional governance, deterministic portfolio state, replay reproducibility, and evidence lineage.

## Constitutional Scope

- Owns portfolio registry, mission portfolio coordination, resource planning, prioritization, dependency management, health, conflict detection, analytics, executive dashboard, reporting, evidence, APIs, and scale qualification.
- Consumes MC-1 Mission Management, MC-2 Scenario Planning, MC-3 Decision Support, registry, CAF runtime, authority, policy, safety, evidence, replay, certification, and runtime orchestration services.
- Qualifies only when the platform demonstrates the 1,000 concurrent mission target with deterministic replay under load.

## Runtime Contract

- `types/portfolio-management.ts` defines the MC-4 portfolio constitution.
- `services/portfolio-management/index.ts` implements deterministic portfolio assembly, validation, replay hashing, integrity hashing, and bundle publication.
- `app/api/portfolio-management/*` exposes authenticated route slices for contract, validation, registry, engine, resources, prioritization, dependencies, health, conflicts, analytics, dashboard, reporting, evidence, APIs, scale, and readiness.

## Verification

Run the focused MC-4 suite:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/portfolio-management/portfolioManagement.test.ts
```

Run a scoped typecheck for the MC-4 type, service, and API routes, then run the cumulative W1/W2/MC chain through `tests/unit/portfolio-management/portfolioManagement.test.ts`.
