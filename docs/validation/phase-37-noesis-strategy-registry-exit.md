# Phase 37 — Noesis Strategy Registry Exit

## Outcome

Phase 37 makes learning methods durable, versioned, governed, context-aware Strategy Registry objects. It can observe how strategies perform and propose a controlled improvement, but it cannot silently alter a strategy, execute a plan, redefine valid learning, or cross the capability boundary.

## Enforced invariants

- Strategy definitions are append-only, workspace-scoped records composed from standard learning primitives.
- Every definition starts as a hypothesis; only a human governor may approve or activate it.
- Eligibility filters lifecycle, context, prerequisites, resources, budget, teacher availability, and constitutional constraints before advisory ranking.
- Recommendations are explainable and await an approved learning plan; they never grant execution.
- Runs require an existing Phase 28 execution lease, bounded limits, explicit stops, and predeclared adaptive branches.
- Performance profiles are contextual observations, never causal winner claims.
- Failure signals and remediation are review-gated proposals.
- Strategy experiments require a human authorization, a designated independent evaluator, retention measurement, and adversarial review before approval.
- Hypotheses, experiments, evaluations, and governance decisions are append-only artifacts with correlated Phase 10 audit events.
- Strategy optimization cannot change durable knowledge, capability authorization, or the Learning Constitution.

## Validation

```text
tests/unit/learning-constitution/strategyRegistry.test.ts          3 passed
tests/unit/learning-constitution/strategyRecommendation.test.ts    2 passed
tests/unit/learning-constitution/strategyRunManager.test.ts        2 passed
tests/unit/learning-constitution/strategyPerformance.test.ts       2 passed
tests/unit/learning-constitution/strategyExperiment.test.ts        2 passed
tests/unit/learning-constitution/strategyRegistryWorkflow.test.ts  1 passed
tests/unit/learning-constitution/phase37Acceptance.test.ts         1 passed
npx tsc --noEmit --pretty false                                    passed
npx prisma migrate status                                          database schema up to date
```

The acceptance lifecycle registers a structured strategy hypothesis, filters and recommends an active governed version, starts a bounded leased run, derives an observed failure signal and profile, creates a review-gated hypothesis, evaluates a controlled experiment independently, and accepts a human governance decision. At every stage, the resulting records retain no execution, durable-knowledge, or capability authority.
