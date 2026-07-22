# Phase 8ALT.9.2 - Mission Knowledge Capture Engine

The Mission Knowledge Capture Engine records completed mission experience into deterministic, normalized, replayable knowledge records for downstream analysis.

## Scope

- Capture-only: no learning, optimization, recommendation generation, or activation.
- Consumes the Phase 8ALT.9.1 Knowledge Evolution Contract.
- Invalid captures fail closed and produce immutable audit records.
- Captured records preserve replay references, evidence lineage, governance status, tenant isolation, and integrity hashes.

## API Surface

- `GET /api/mission-knowledge-capture-engine/capture`
- `POST /api/mission-knowledge-capture-engine/capture`
- `POST /api/mission-knowledge-capture-engine/records`
- `POST /api/mission-knowledge-capture-engine/audit`
- `POST /api/mission-knowledge-capture-engine/normalize`
- `POST /api/mission-knowledge-capture-engine/evidence`
- `POST /api/mission-knowledge-capture-engine/validate`
- `GET /api/mission-knowledge-capture-engine/inspect`
- `POST /api/mission-knowledge-capture-engine/inspect`

## Non-Authority Guarantees

All outputs carry `capture_only: true`, `learning_execution_authorized: false`, `optimization_authority: false`, `activation_authority: false`, and `historical_truth_mutable: false`.
