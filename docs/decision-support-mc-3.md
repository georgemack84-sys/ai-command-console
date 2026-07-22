# MC-3 — Decision Support

Decision Support transforms mission and scenario evidence into transparent, explainable, evidence-backed recommendations. It is advisory only: it never makes operational decisions, never executes mission actions, and preserves operator supremacy.

## Constitutional Scope

- Owns the decision engine, tradeoff analyzer, multi-criteria evaluator, evidence aggregator, decision justification service, MissionAdvisoryGate, decision artifacts, and advisory governance.
- Consumes MC-1 Mission Management, MC-2 Scenario Planning, evidence, replay, certification, policy, authority, safety, planning, memory, collaboration, delegation, and runtime orchestration services.
- Publishes decision packages, recommendation reports, tradeoff reports, evidence bundles, and decision justification reports only after MissionAdvisoryGate passes.

## Runtime Contract

- `types/decision-support.ts` defines the MC-3 advisory decision constitution.
- `services/decision-support/index.ts` implements deterministic recommendation assembly, validation, replay hashing, integrity hashing, and bundle publication.
- `app/api/decision-support/*` exposes authenticated route slices for contract, validation, engine, tradeoffs, multi-criteria evaluation, evidence, justification, advisory gate, artifacts, governance, and readiness.

## Verification

Run the focused MC-3 suite:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/decision-support/decisionSupport.test.ts
```

Run a scoped typecheck for the MC-3 type, service, and API routes, then run the cumulative W1/W2/MC chain through `tests/unit/decision-support/decisionSupport.test.ts`.
