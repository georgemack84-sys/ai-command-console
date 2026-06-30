# Phase 8F.2 - Authority Boundary Engine

## Purpose

The Authority Boundary Engine deterministically validates whether every autonomous action operates within its authorized scope before execution. It is the primary authorization enforcement service for Controlled Autonomy and never grants new authority.

## Delivered

- Authority Boundary Engine: `services/authority-boundary-engine`
- Canonical authority schemas: `types/authority-boundary-engine.ts`
- Boundary Enforcement Contract integration
- Authority validation, scope validation, delegation validation, privilege escalation detection, runtime authority monitoring, authorization decisioning, evidence recording, Truth Ledger entry, replay result, and operator visibility
- API routes under `/api/authority-boundary-engine`
- Unit coverage in `tests/unit/authority-boundary-engine/authorityBoundaryEngine.test.ts`

## API Surface

- `GET /api/authority-boundary-engine/contract`
- `POST /api/authority-boundary-engine/validate`
- `POST /api/authority-boundary-engine/decision`
- `POST /api/authority-boundary-engine/evidence`
- `POST /api/authority-boundary-engine/replay`
- `POST /api/authority-boundary-engine/ledger`
- `GET /api/authority-boundary-engine/inspect`
- `POST /api/authority-boundary-engine/inspect`

## Guarantees

- Explicit authority required; no implied authority is accepted
- Least-privilege validation for requested action, requested scope, authority level, mission scope, tenant ownership, and delegation chain
- Deterministic ALLOW, ALLOW_WITH_RESTRICTIONS, ESCALATE, BLOCK, and FAIL_SAFE decisions
- Prevention of privilege escalation, role expansion, unauthorized delegation, delegation loops, recursive delegation, hidden delegation, expired delegation, and authority loss
- Immutable authorization evidence, Truth Ledger recording, replay reconstruction, lineage reference, and integrity hashes
- No new authority creation, no autonomous execution, and fail-closed behavior when authority is uncertain or lost
