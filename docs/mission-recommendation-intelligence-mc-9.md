# MC-9 — Recommendation Intelligence

Recommendation Intelligence produces evidence-backed, governed operational recommendations for Mission Control. It improves decision quality while remaining strictly advisory.

## Constitutional Scope

- Owns recommendation generation, analysis, explanation, governance, prioritization, confidence, lifecycle, feed, reports, evidence, and APIs.
- Consumes MC-1 through MC-8.
- Rejects autonomous execution, mission mutation, governance override, operator authority bypass, hidden uncertainty, missing evidence, and non-deterministic recommendation generation.

## Runtime Contract

- `types/mission-recommendation-intelligence.ts` defines the MC-9 recommendation constitution.
- `services/mission-recommendation-intelligence/index.ts` implements deterministic advisory recommendation assembly, validation, replay hashing, integrity hashing, and bundle publication.
- `app/api/mission-recommendation-intelligence/*` exposes authenticated route slices for contract, validation, engine, analysis, explanation, governance, prioritization, confidence, lifecycle, feed, reports, evidence, APIs, and readiness.

## Verification

Run the focused MC-9 suite:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/mission-recommendation-intelligence/missionRecommendationIntelligence.test.ts
```

Run a scoped typecheck for the MC-9 type, service, and API routes, then run the cumulative W1/W2/MC chain through `tests/unit/mission-recommendation-intelligence/missionRecommendationIntelligence.test.ts`.
