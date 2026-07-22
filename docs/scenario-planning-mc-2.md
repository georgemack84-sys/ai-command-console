# MC-2 — Scenario Planning

Scenario Planning is Mission Control's governed exploration layer. It turns one approved MC-1 mission into candidate futures for analysis, comparison, evidence capture, recommendation, and approval without mutating the authoritative mission record.

## Constitutional Scope

- Owns scenario definition, alternative future generation, assumption management, what-if analysis, scenario evaluation, risk and opportunity assessment, scenario comparison, recommendation explanations, governance, evidence, lifecycle, outputs, and qualification readiness.
- Consumes MC-1 Mission Management plus capability, skill, authority, policy, safety, planning, memory, and evidence services.
- Enforces deterministic branching, exactly one authoritative mission reference per scenario, immutable planning evidence, explainable recommendations, repeatable evaluations, deterministic comparisons, and complete assumption traceability.

## Runtime Contract

- `types/scenario-planning.ts` defines the MC-2 scenario planning constitution.
- `services/scenario-planning/index.ts` implements deterministic assembly, validation, replay hashing, integrity hashing, and bundle publication.
- `app/api/scenario-planning/*` exposes authenticated route slices for contract, validation, definition, generation, assumptions, what-if, evaluation, risk, opportunity, comparison, recommendation, governance, evidence, lifecycle, outputs, and readiness.

## Verification

Run the focused MC-2 suite:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/scenario-planning/scenarioPlanning.test.ts
```

Run a scoped typecheck for the MC-2 type, service, and API routes, then run the cumulative W1/W2/MC chain through `tests/unit/scenario-planning/scenarioPlanning.test.ts`.
