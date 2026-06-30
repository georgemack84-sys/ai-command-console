# Mission Control Phase 8E.4 - Recovery & Intervention Intelligence

## Purpose

Recovery & Intervention Intelligence evaluates runtime and governance assurance evidence to recommend the safest corrective action when execution deviates from its approved path. It never performs recovery, modifies workflows, grants approval, changes authority, or bypasses governance.

## Delivered

- Recovery & Intervention Intelligence: `services/recovery-intervention-intelligence`
- Canonical types: `types/recovery-intervention-intelligence.ts`
- Continue, retry, pause, rollback, alternate plan, escalation, and termination recommendation logic
- Recovery confidence, rollback confidence, intervention priority, explainability, recommendation evidence, validation, replay, and dashboard outputs
- API routes under `/api/recovery-intervention-intelligence`
- Unit certification coverage in `tests/unit/recovery-intervention-intelligence/recoveryInterventionIntelligence.test.ts`

## API Surface

- `GET /api/recovery-intervention-intelligence/contract`
- `POST /api/recovery-intervention-intelligence/recommendation`
- `POST /api/recovery-intervention-intelligence/confidence`
- `POST /api/recovery-intervention-intelligence/priority`
- `POST /api/recovery-intervention-intelligence/explainability`
- `POST /api/recovery-intervention-intelligence/evidence`
- `GET /api/recovery-intervention-intelligence/dashboard`
- `POST /api/recovery-intervention-intelligence/dashboard`
- `POST /api/recovery-intervention-intelligence/replay`

## Guarantees

- Deterministic recommendations for continue, retry, pause, rollback, alternate plan, escalation, and termination
- Evidence-based recovery confidence, rollback confidence, and intervention priority
- Complete explainability for selected and rejected options
- Immutable recommendation hashing and deterministic replay
- Advisory-only operation with recovery, workflow, approval, authority, and governance bypass flags fixed to false
- Fail-closed behavior for insufficient evidence, replay impossibility, constitutional violations, authority ambiguity, tenant failures, and integrity failures

## Phase 8E.5 Readiness

The component produces a recovery intervention package containing option assessments, confidence, priority, recommendation, explainability, validation, replay, and dashboard projection. Passing packages are ready for Execution Assurance Intelligence certification.
