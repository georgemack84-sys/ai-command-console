# Phase 38 — Noesis Strategy Selection & Optimization Exit

## Outcome

Phase 38 selects among Phase 37’s governed strategies for a particular objective, learner state, context, and budget. It can recommend a strategy, portfolio, bounded adaptation, exploration choice, or strategy switch; it cannot approve a plan, issue a lease, execute learning, mutate strategy definitions, or create capability authority.

## Enforced invariants

- Immutable selection requests retain objective, learner state, prerequisites, context, risk, horizon, resources, budget, and hard constraints.
- Hard eligibility filtering completes before contextual ranking. Failed prerequisites block selection.
- Ranking combines observed contextual outcomes with resource/risk cost and an uncertainty penalty; insufficient comparable evidence cannot appear on the Pareto frontier.
- Rankings state observed association only and never convert historical correlation into experimental proof.
- Runtime health, diminishing returns, and adaptation outputs are non-executing observations or recommendations.
- Adaptive branches must be explicitly predeclared by the selected strategy.
- A switch recommendation requires repeated failures, minimum attempts, and an expected benefit above both switch cost and uncertainty margin; it always needs a separate approved plan.
- Portfolio transitions are explicit and exploration is limited to low-risk, rollback-required experimental budgets.
- Selection decisions persist append-only and emit correlated Phase 10 optimization audit events.
- All Phase 38 outputs retain no execution, durable-knowledge, certification, or capability authority.

## Validation

```text
tests/unit/learning-constitution/strategySelection.test.ts             2 passed
tests/unit/learning-constitution/strategyRanking.test.ts               1 passed
tests/unit/learning-constitution/strategyRuntimeOptimization.test.ts   2 passed
tests/unit/learning-constitution/strategyPortfolio.test.ts             2 passed
tests/unit/learning-constitution/phase38Acceptance.test.ts             1 passed
npx tsc --noEmit --pretty false                                        passed
npx prisma migrate status                                              database schema up to date
```

The acceptance lifecycle records a long-horizon, boundary-sensitive selection request, excludes an ineligible candidate before decision formation, ranks only the eligible alternatives with an uncertainty penalty, observes a failing bounded run, issues a switch recommendation that still requires a new approved plan, rejects exploration for a medium-risk objective, and writes the immutable optimization decision to the Phase 10 audit ledger. Every resulting object remains recommendation-only.
