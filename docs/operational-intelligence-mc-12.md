# MC-12 — Operational Intelligence

Operational Intelligence transforms validated operational data into evidence-backed strategic and executive insight. It is advisory only and never authorizes, modifies, or executes operational activity.

## Constitutional Scope

- Owns strategic intelligence, operational insights, executive intelligence, trend analysis, strategic forecasts, organizational intelligence, registry, reports, evidence, and APIs.
- Consumes MC-1 through MC-6, MC-8 through MC-11, and the Temporal Analytics Contract.
- Rejects intelligence without evidence, missing replay traceability, non-reproducible forecasts, non-deterministic generation, execution, mission approval, state mutation, governance override, authority bypass, policy bypass, and safety bypass.

## Runtime Contract

- `types/operational-intelligence.ts` defines the MC-12 operational intelligence constitution.
- `services/operational-intelligence/index.ts` implements deterministic evidence-backed intelligence assembly, validation, replay hashing, integrity hashing, and bundle publication.
- `app/api/operational-intelligence/*` exposes authenticated route slices for contract, validation, strategic intelligence, insights, executive intelligence, trends, forecasts, organizational intelligence, registry, reports, evidence, APIs, and readiness.

## Verification

Run the focused MC-12 suite:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/operational-intelligence/operationalIntelligence.test.ts
```

Run a scoped typecheck for the MC-12 type, service, and API routes, then run the cumulative W1/W2/MC chain through `tests/unit/operational-intelligence/operationalIntelligence.test.ts`.
