# Phase 8E.D - Intervention Recommendation Engine

## Purpose

The Intervention Recommendation Engine recommends deterministic, governance-compliant corrective actions when runtime supervision detects degradation. It consumes Runtime Observation and Drift & Health Intelligence outputs, then publishes advisory-only recommendations for operator review, governed pauses, governed rollback paths, and confidence restoration.

## Delivered

- Intervention Recommendation Engine: `services/intervention-recommendation-engine`
- Canonical recommendation types: `types/intervention-recommendation-engine.ts`
- Recommendation, evidence, metadata, validation, replay, and dashboard projection
- API routes under `/api/intervention-recommendation-engine`
- Unit coverage in `tests/unit/intervention-recommendation-engine/interventionRecommendationEngine.test.ts`

## API Surface

- `GET /api/intervention-recommendation-engine/contract`
- `POST /api/intervention-recommendation-engine/recommend`
- `POST /api/intervention-recommendation-engine/validate`
- `POST /api/intervention-recommendation-engine/replay`
- `POST /api/intervention-recommendation-engine/evidence`
- `GET /api/intervention-recommendation-engine/inspect`
- `POST /api/intervention-recommendation-engine/inspect`

## Guarantees

- Advisory-only recommendations with no intervention, pause, rollback, authority grant, or governance bypass
- Deterministic recommendation, evidence, metadata, validation, replay, and package hashes
- Explicit authority, policy, constitutional, replay, lineage, tenant, and integrity validation
- Evidence-backed recommendations suitable for Truth Ledger and replay inspection
- Fail-closed validation for nondeterminism, missing evidence, incomplete governance/evidence review, unsafe pause advice, rollback boundary violations, unjustified confidence restoration, missing authority or governance references, replay mismatch, lineage gaps, tenant violations, hidden logic, autonomous intervention attempts, governance bypass, and integrity failures
