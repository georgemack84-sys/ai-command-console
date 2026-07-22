# Phase 8ALT.6.4 - Recovery & Weak-Point Intelligence

The Recovery & Weak-Point Intelligence subsystem converts deterministic failure observation ledgers into advisory resilience intelligence. It evaluates recovery effectiveness, identifies weak points, computes stress scores, creates recovery strategies, recommends improvements, and produces operational readiness summaries without executing recovery actions.

## Implemented Scope

- Recovery analysis, recovery strategies, weak-point analysis, stress scores, recommendations, resilience reports, architecture improvements, and operational readiness artifacts.
- Deterministic scoring from the 8ALT.6.3 subsystem health report and observations.
- Immutable recovery intelligence ledger with evidence lineage, replay references, integrity hashes, governance validation, constitutional validation, authority validation, tenant isolation, and operator visibility.
- Fail-closed validation for missing observations, incomplete metrics, missing strategies, missing weak-point analysis, non-reproducible stress score, missing governance/constitutional/authority validation, missing replay/evidence lineage, cross-tenant intelligence, hidden recommendations, non-advisory actions, and integrity failure.

## API Surface

- `GET /api/recovery-weak-point-intelligence/contract`
- `POST /api/recovery-weak-point-intelligence/analyze`
- `POST /api/recovery-weak-point-intelligence/strategies`
- `POST /api/recovery-weak-point-intelligence/weak-points`
- `POST /api/recovery-weak-point-intelligence/scores`
- `POST /api/recovery-weak-point-intelligence/recommendations`
- `POST /api/recovery-weak-point-intelligence/readiness`
- `POST /api/recovery-weak-point-intelligence/replay`
- `POST /api/recovery-weak-point-intelligence/validate`
- `GET|POST /api/recovery-weak-point-intelligence/inspect`
