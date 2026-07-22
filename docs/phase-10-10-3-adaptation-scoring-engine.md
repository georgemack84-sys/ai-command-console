# Phase 10.10.3 — Adaptation Scoring Engine

## Purpose

Deterministically evaluates generated adaptation proposals across standardized dimensions without approving, suppressing, prioritizing, mutating, or implementing them.

## Implemented Surface

- `POST /adaptation-scoring-engine/score`
- `POST /adaptation-scoring-engine/scores`
- `POST /adaptation-scoring-engine/dimensions`
- `POST /adaptation-scoring-engine/explanations`
- `POST /adaptation-scoring-engine/metrics`
- `POST /adaptation-scoring-engine/replay`
- `POST /adaptation-scoring-engine/inspect`
- `GET /adaptation-scoring-engine/contract`

## Dimensions

- Benefit
- Risk
- Confidence
- Evidence
- Operator usefulness
- Governance sensitivity
- Replay completeness
- Certification complexity
- Rollback readiness
- Explainability

## Guarantees

Scores are calculated from validated proposal contract data and evidence only. Every score includes a versioned explanation, evidence references, calculation lineage, confidence rationale, and replay references.

## Fail-Closed Conditions

Scoring fails closed for invalid proposal contracts, incomplete evidence, missing replay references, absent governance, absent constitutional analysis, absent authority analysis, integrity failure, tenant isolation violation, irreproducible score replay, nondeterministic scoring, mutation attempts, suppression attempts, prioritization attempts, approval attempts, and implementation attempts.

## Authority Boundary

The engine evaluates proposals only. It does not approve, reject, suppress, prioritize, implement, or mutate proposals.
