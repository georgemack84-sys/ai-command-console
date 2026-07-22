# MC-10 — Operator Dashboard

The Operator Dashboard is Mission Control's unified operational workspace. It aggregates mission, portfolio, replay, digital twin, simulation, risk, recommendation, alert, KPI, search, filter, visualization, navigation, and evidence views into one governed interface.

## Constitutional Scope

- Owns dashboard composition, dashboard views, search, filtering, visualization, navigation, dashboard security, APIs, and dashboard audit evidence.
- Consumes MC-1, MC-4, MC-5, MC-6, MC-7, MC-8, MC-9, CCI evidence/replay/observability, and CAF evidence/runtime status.
- Rejects execution, approvals, workload dispatch, mission mutation, portfolio mutation, automation invocation, governance bypass, operator approval bypass, non-deterministic queries, missing lineage, and missing audit evidence.

## Runtime Contract

- `types/operator-dashboard.ts` defines the MC-10 dashboard constitution.
- `services/operator-dashboard/index.ts` implements deterministic read-only dashboard assembly, validation, replay hashing, integrity hashing, and bundle publication.
- `app/api/operator-dashboard/*` exposes authenticated route slices for contract, validation, dashboard, views, search, filters, visualization, navigation, security, APIs, evidence, audit, and readiness.

## Verification

Run the focused MC-10 suite:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/operator-dashboard/operatorDashboard.test.ts
```

Run a scoped typecheck for the MC-10 type, service, and API routes, then run the cumulative W1/W2/MC chain through `tests/unit/operator-dashboard/operatorDashboard.test.ts`.
