# Phase 12.3 - Recommendation Cycle Management

Phase 12.3 establishes the Recommendation Cycle as the canonical deterministic transaction boundary for Strategic Recommendation Intelligence. The implementation lives in `services/recommendation-cycle-management` and consumes the immutable policy binding produced by Phase 12.2 before any recommendation generation is allowed.

## Implemented Capabilities

- First-class `RecommendationCycleArtifact` with deterministic identity, lifecycle, authority context, policy manifest binding, replay metadata, recovery metadata, and integrity hash.
- Cycle state machine from `REGISTERED` through `ARCHIVED`, with exactly one terminal outcome enforced.
- Atomic transaction record with locking, concurrency protection, rollback semantics, deterministic commit, and idempotency key.
- Policy-bound entry gate that fails closed unless manifest binding, authority, governance, constitutional validation, and immutable policy snapshot are present.
- Deterministic generation coordination for candidates, scenarios, forecasts, baselines, portfolios, evidence, rationale, and traceability artifacts.
- Deterministic evaluation coordination for qualification, evidence sufficiency, duplicate suppression, comparison, thresholds, confidence, portfolio evaluation, tie resolution, and governance validation.
- Completion validator that rejects partial cycles, missing artifacts, incomplete evaluations, ledger failure, replay failure, integrity failure, and referential integrity gaps.
- Recovery manager that preserves transaction identity and fails closed without fabricated artifacts or governance bypass.
- Supersession record that requires a new cycle for reevaluation and never reopens completed cycles.
- Archive record that preserves cycle metadata, policy manifest, authority bindings, lifecycle history, transaction log, artifacts, evaluations, approvals, comparisons, replay artifacts, integrity proofs, lineage, and supersession references.
- Append-only cycle ledger, replay record, observability report, and Phase 12.3 certification suite.

## API Surface

- `GET /api/recommendation-cycle-management/contract`
- `GET|POST /api/recommendation-cycle-management/cycle`
- `GET|POST /api/recommendation-cycle-management/transaction`
- `GET|POST /api/recommendation-cycle-management/generation`
- `GET|POST /api/recommendation-cycle-management/evaluation`
- `GET|POST /api/recommendation-cycle-management/completion`
- `GET|POST /api/recommendation-cycle-management/recovery`
- `GET|POST /api/recommendation-cycle-management/supersession`
- `GET|POST /api/recommendation-cycle-management/archive`
- `GET|POST /api/recommendation-cycle-management/replay`
- `GET|POST /api/recommendation-cycle-management/ledger`
- `GET|POST /api/recommendation-cycle-management/certification`
- `POST /api/recommendation-cycle-management/validate`
- `GET|POST /api/recommendation-cycle-management/observability`

## Certification Gate

The certification suite passes only when cycles are deterministic, policy-bound, authority-resolved, transactionally atomic, generation/evaluation coordinated, mathematically complete, fail-closed recoverable, immutable after completion, superseded through new cycles, archived with replay history, ledgered append-only, tenant-isolated, advisory-only, observable, and replayable.
