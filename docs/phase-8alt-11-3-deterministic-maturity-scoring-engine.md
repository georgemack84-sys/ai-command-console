# Phase 8ALT.11.3 - Deterministic Maturity Scoring Engine

## Purpose

Phase 8ALT.11.3 converts validated maturity domain evaluations into deterministic maturity scoring results. The engine applies approved weighting, score normalization, weighted aggregation, confidence calculation, readiness calculation, replay references, lineage references, governance validation, constitutional validation, and integrity verification.

The engine consumes Phase 8ALT.11.2 evaluation results. It scores the ten canonical domains defined by Phase 8ALT.11.1 and evaluated by Phase 8ALT.11.2. Runtime assurance is represented through Execution Intelligence, Resilience, and Visibility rather than being scored as a separate domain.

## Outputs

- approved weighting profile
- normalized domain scores
- weighted domain contributions
- overall maturity score
- maturity classification
- confidence score and classification
- readiness score and classification
- scoring explanation
- immutable scoring ledger
- validation result
- observability surface

## Deterministic Controls

Validation verifies:

- weighting profile presence
- weighting profile immutability
- normalization consistency
- aggregate replay consistency
- deterministic confidence calculation
- deterministic readiness calculation
- governance validation
- constitutional validation
- integrity verification
- replay reconstruction
- absence of hidden scoring logic
- tenant isolation
- advisory-only behavior

## API Surface

- `GET /api/deterministic-maturity-scoring-engine/score`
- `POST /api/deterministic-maturity-scoring-engine/score`
- `POST /api/deterministic-maturity-scoring-engine/weights`
- `POST /api/deterministic-maturity-scoring-engine/normalized`
- `POST /api/deterministic-maturity-scoring-engine/ledger`
- `POST /api/deterministic-maturity-scoring-engine/validate`
- `GET /api/deterministic-maturity-scoring-engine/inspect`
- `POST /api/deterministic-maturity-scoring-engine/inspect`

All endpoints require authenticated workspace membership and preserve advisory-only behavior. Scoring never advances maturity, grants certification, changes authority, changes governance, or modifies execution behavior.
