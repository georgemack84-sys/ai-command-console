# Phase 39 — Noesis Strategy Evaluation Exit

## Outcome

Phase 39 provides the empirical evidence layer for Phase 37 strategies and Phase 38 selection. It records what a strategy produced under a defined context, with provenance for each metric and explicit treatment of uncertainty, missing data, invalid evidence, failure attribution, and contextual tradeoffs.

## Enforced invariants

- Strategy evaluations are immutable, append-only, workspace-scoped artifacts.
- Every observed metric retains evidence identifiers; missing, invalid, and not-applicable values remain explicit.
- Complete evaluations cannot hide missing metrics, and observed metrics without evidence invalidate the record.
- Profiles compare only matching risk, difficulty, and prerequisite cohorts; invalid evidence is excluded.
- Evidence confidence is explicit. Sparse evidence remains experimental or preliminary and cannot become optimization truth.
- Profiles express observed association only, never causal proof.
- Evaluation failures are attributed as learning, strategy, selection, or invalid-evaluation failures before informing optimization.
- Dominance and Pareto analysis are contextual projections; a dominated strategy is retained as evidence and is never retired automatically.
- Evaluations, profiles, and failures emit correlated Phase 10 audit events.
- Measurement cannot mutate strategy definitions, selection policy, learning plans, leases, durable knowledge, or capability authority.

## Validation

```text
tests/unit/learning-constitution/strategyEvaluation.test.ts           2 passed
tests/unit/learning-constitution/strategyEvaluationProfile.test.ts    1 passed
tests/unit/learning-constitution/strategyEvaluationAnalysis.test.ts   2 passed
tests/unit/learning-constitution/strategyEvaluationAudit.test.ts      1 passed
tests/unit/learning-constitution/phase39Acceptance.test.ts            1 passed
npx tsc --noEmit --pretty false                                       passed
npx prisma migrate status                                             database schema up to date
```

The acceptance lifecycle captures three independent, complete evaluations with provenance-backed immediate, novel, retention, and calibration measures; derives a comparable cohort profile; records a separate retention-collapse attribution requiring reflection; and audits the evaluation, profile, and failure. Every artifact remains immutable and non-authoritative.
