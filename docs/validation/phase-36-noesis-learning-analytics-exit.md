# Phase 36 — Noesis Learning Analytics Exit

## Outcome

Phase 36 records immutable learning telemetry and derives reproducible, versioned analytics projections. Its trends remain explicitly observational: they can surface an insight or strategy hypothesis, but can never alter a learning plan, evidence state, certification, capability grant, or executable authority.

## Enforced invariants

- Learning sessions, telemetry, and analytics snapshots are append-only, workspace-scoped artifacts.
- Telemetry distinguishes event time from ingestion time and carries an idempotency key.
- Snapshots retain source-event identifiers, algorithm and metric versions, plus a configuration hash for reproducibility.
- Data-quality checks reject invalid measures and mark incomplete measurements as warnings rather than creating false precision.
- Trends say only `OBSERVED_ASSOCIATION`; causal claims are always false.
- Insights and hypotheses are traceable, non-executable proposals that require governed review.
- Analytics have no mechanism to mutate strategy execution, evidence, certification, capability, or authority state.

## Validation

```text
tests/unit/learning-constitution/learningAnalytics.test.ts      3 passed
tests/unit/learning-constitution/phase36Acceptance.test.ts      1 passed
npx tsc --noEmit --pretty false                                 passed
npx prisma migrate status                                       database schema up to date
```

The acceptance lifecycle starts one immutable practice session, records baseline/final assessment, prompting, correction, human intervention, and token-use telemetry, verifies idempotent telemetry persistence, projects a reproducible snapshot, aggregates a weak observational pattern, and produces a proposed strategy hypothesis. The hypothesis remains review-required and has no autonomous plan-change or execution authority.
