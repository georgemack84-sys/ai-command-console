# MC-8 — Risk Assessment

Risk Assessment continuously evaluates operational risk across missions, scenarios, portfolios, simulations, and temporal analytics. Its outputs are governed, explainable, advisory-only risk intelligence.

## Constitutional Scope

- Owns continuous risk evaluation, risk registry, trend analysis, forecasting, correlation, prioritization, explainability, visualization, reporting, evidence, and APIs.
- Consumes MC-2 Scenario Planning, MC-3 Decision Support, MC-5 Replay, MC-6 Digital Twin, MC-7 Simulation, and the Temporal Analytics Contract.
- Rejects opaque scoring, non-deterministic risk calculations, missing lineage, mutable evidence, mission state mutation, Digital Twin mutation, simulation outcome mutation, and operator decision override.

## Runtime Contract

- `types/risk-assessment.ts` defines the MC-8 risk assessment constitution.
- `services/risk-assessment/index.ts` implements deterministic advisory risk assessment, validation, replay hashing, integrity hashing, and bundle publication.
- `app/api/risk-assessment/*` exposes authenticated route slices for contract, validation, temporal analytics, evaluation, registry, trends, forecast, correlation, prioritization, explainability, visualization, reports, evidence, APIs, and readiness.

## Verification

Run the focused MC-8 suite:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/risk-assessment/riskAssessment.test.ts
```

Run a scoped typecheck for the MC-8 type, service, and API routes, then run the cumulative W1/W2/MC chain through `tests/unit/risk-assessment/riskAssessment.test.ts`.
