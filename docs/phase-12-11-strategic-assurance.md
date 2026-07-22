# Phase 12.11 - Lineage, Replay, Integrity, and Explainability

Phase 12.11 adds a deterministic strategic assurance layer over the Phase 12 recommendation intelligence chain. It verifies lineage completeness, artifact origin, full-cycle replay, partial artifact replay, divergence classification, integrity hashes, canonical ownership, explainability, immutable ledger behavior, and certification readiness.

## Service

`services/strategic-assurance` exposes:

- `runStrategicAssurance(input?)`
- `validateStrategicAssurance(result?)`
- `replayStrategicAssurance(result?)`
- `getStrategicAssuranceContract()`

The service consumes the Phase 12.10 outcome observation result and binds assurance artifacts to the observed recommendation cycle and policy manifest. All assurance outputs include deterministic integrity hashes and fail closed when a lineage, replay, integrity, ownership, explainability, ledger, tenant, or governance invariant is violated.

## API

Authenticated workspace members can inspect the assurance surface through:

- `GET /api/strategic-assurance/contract`
- `GET|POST /api/strategic-assurance/lineage`
- `GET|POST /api/strategic-assurance/origin`
- `GET|POST /api/strategic-assurance/cycle-replay`
- `GET|POST /api/strategic-assurance/artifact-replay`
- `GET|POST /api/strategic-assurance/divergence`
- `GET|POST /api/strategic-assurance/integrity`
- `GET|POST /api/strategic-assurance/ownership`
- `GET|POST /api/strategic-assurance/explain`
- `GET|POST /api/strategic-assurance/ledger`
- `GET|POST /api/strategic-assurance/certification`
- `POST /api/strategic-assurance/validate`
- `GET|POST /api/strategic-assurance/observability`

POST requests may provide either a `result` to inspect or an input scenario such as `FULL_REPLAY_MISMATCH`, `HASH_MISMATCH`, `OWNERSHIP_CONFLICT`, or `GOVERNANCE_BYPASS`.

## Certification

The certification suite contains 21 deterministic tests:

- complete lineage graph
- no orphan artifacts
- one origin per artifact
- circular origin rejection
- valid origins
- deterministic full cycle replay
- deterministic artifact replay
- classified replay divergence
- reproducible artifact, manifest, cycle, lineage, and ledger hashes
- no duplicate authoritative state
- unique canonical ownership
- complete explainability
- append-only and hash-linked ledger
- tenant isolation
- governance preservation
- fail-closed enforcement
