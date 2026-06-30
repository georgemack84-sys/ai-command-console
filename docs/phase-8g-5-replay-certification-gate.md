# Phase 8G.5 — Replay Certification Gate

## Summary

Phase 8G.5 adds the final certification gate for the Autonomous Replay framework. It validates the replay contract, execution reconstruction, planning and decision reconstruction, supervision and intervention replay, governance preservation, integrity verification, lineage completeness, tenant isolation, and explainability before downstream autonomy phases can depend on replay services.

## Delivered

- Matrix-driven replay certification suite across contract, schema, execution, planning, decision, delegation, orchestration, supervision, intervention, rollback, pause, outcome, confidence, ordering, checkpoint, governance, integrity, lineage, tenant, authority, constitutional, and explainability areas.
- Certification decision engine with `PASS`, `CONDITIONAL_PASS`, and `FAIL`.
- Immutable certification evidence package with replay quality metrics, executed tests, failed tests, warnings, Truth Ledger reference, lineage reference, evidence hashes, replay references, and integrity references.
- Audit report, readiness assessment, append-only ledger entry, digital signature, and visibility surface.
- Fail-closed scenarios for replay divergence, nondeterministic replay, mismatch, authority escalation, governance bypass, constitutional violation, integrity corruption, lineage break, cross-tenant replay, and unexplained replay state.
- Authenticated API routes under `/api/replay-certification-gate`.

## API Surface

- `GET /api/replay-certification-gate/contract`
- `POST /api/replay-certification-gate/certify`
- `POST /api/replay-certification-gate/report`
- `POST /api/replay-certification-gate/evidence`
- `POST /api/replay-certification-gate/audit`
- `POST /api/replay-certification-gate/readiness`
- `GET|POST /api/replay-certification-gate/inspect`

## Certification Rule

Downstream autonomy remains locked unless the gate returns full `PASS`. `CONDITIONAL_PASS` records non-critical metadata gaps but still blocks production readiness. Any critical validation failure returns `FAIL` and produces remediation-oriented readiness output.
