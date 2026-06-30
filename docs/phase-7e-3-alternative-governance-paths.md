# Phase 7E.3 Alternative Governance Paths

7E.3 expands generated governance recommendations into multiple governed advisory options: preferred, conservative, escalation, and remediation paths.

Each path is evidence-bound, risk-differentiated, confidence-scored, governance-constrained, advisory-only, tenant-safe, Truth Ledger-recorded, replayable, and operator-visible.

## Deliverables

- `types/recommendation-paths.ts`
- `services/recommendation-paths/index.ts`
- `app/api/recommendation-paths/*`
- `tests/unit/recommendation-paths/recommendationPaths.test.ts`

## API Surface

- `GET /api/recommendation-paths/contract`
- `POST /api/recommendation-paths/generate`
- `POST /api/recommendation-paths/validate`
- `POST /api/recommendation-paths/replay`
- `POST /api/recommendation-paths/hash`
- `GET|POST /api/recommendation-paths/inspect`

## Certification Rules

7E.3 receives `PASS` when required path types are generated, evidence is bound, risk rationale exists, confidence and priority reproduce, ordering and comparison replay, advisory-only boundaries hold, tenant isolation is preserved, Truth Ledger records exist, and replay reconstructs all paths.

It fails closed for missing required paths, missing evidence, missing risk rationale, confidence/priority/order/comparison mismatch, execution authority, tenant leakage, missing ledger records, replay mismatch, hidden path state, or hash mismatch.
