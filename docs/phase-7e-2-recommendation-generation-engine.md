# Phase 7E.2 Recommendation Generation Engine

7E.2 transforms validated governance findings into deterministic, evidence-backed, advisory-only governance recommendations.

The engine consumes policy, risk, compliance, evidence, and Truth Ledger findings, aggregates evidence, correlates governance domains, generates candidates, calculates priority and confidence, assembles recommendations that conform to the 7E.1 contract, records Truth Ledger metadata, and supports deterministic replay.

## Deliverables

- `types/recommendation-generation.ts`
- `services/recommendation-generation/index.ts`
- `app/api/recommendation-generation/*`
- `tests/unit/recommendation-generation/recommendationGeneration.test.ts`

## API Surface

- `GET /api/recommendation-generation/contract`
- `POST /api/recommendation-generation/generate`
- `POST /api/recommendation-generation/validate`
- `POST /api/recommendation-generation/replay`
- `POST /api/recommendation-generation/hash`
- `GET|POST /api/recommendation-generation/inspect`

## Certification Rules

7E.2 receives `PASS` when generation is deterministic, evidence aggregation succeeds, governance correlations reproduce, priorities and confidence are stable, advisory-only boundaries are enforced, Truth Ledger records exist, replay reconstructs output, lineage is preserved, and tenant isolation holds.

Generation fails closed for missing or unsupported evidence, duplicate recommendations, execution authority, replay mismatch, Truth Ledger recording failure, tenant leakage, hidden state, or generation hash mismatch.
