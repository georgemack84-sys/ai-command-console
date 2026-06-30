# Mission Control Phase 7G.5 - Lineage Certification Gate

## Delivered

Phase 7G.5 adds the Lineage Certification Gate for the full Governance Lineage Intelligence stack. It runs category checks across Governance Lineage Contract, Policy Lineage Reconstruction, Decision Influence Analysis, Governance Explainability, replay determinism, governance boundaries, tenant isolation, and historical integrity.

## Contract Guarantees

- Certification states are `PASS`, `CONDITIONAL_PASS`, and `FAIL`.
- Baseline 7G certification produces an immutable report and evidence package.
- Replay matrix checks lineage, policy ancestry, influence graph, explanations, and Truth Ledger references.
- Critical defects fail closed and block operator approval.
- Conditional pass is limited to non-critical metadata gaps and only permits controlled testing.
- Evidence packages include lineage, policy, influence, explanation, replay, truth ledger, and evidence hashes.
- Certification observability reports total tests, passed tests, failed tests, failures, replay matrix state, and operator approval status.

## API Surface

- `GET /api/lineage-certification/contract`
- `POST /api/lineage-certification/run`
- `POST /api/lineage-certification/validate`
- `POST /api/lineage-certification/hash`
- `GET|POST /api/lineage-certification/inspect`

## Certification Readiness

With this gate, Phase 7G can be certified as a deterministic, replayable, audit-ready governance lineage capability.
