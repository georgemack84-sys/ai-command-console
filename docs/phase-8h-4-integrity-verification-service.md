# Phase 8H.4 - Integrity Verification Service

The Integrity Verification Service is the continuous assurance layer for autonomous history. It verifies the Integrity Contract, Autonomous Hash Chain, and Tamper Detection evidence to decide whether protected autonomous history remains trustworthy and certification-ready.

## Delivered Capabilities

- Continuous, scheduled, and on-demand verification modes.
- Hash reproducibility checks for planning, decision, execution, orchestration, supervision, intervention, replay, parent, lineage, and chain hashes.
- Deterministic replay verification with checkpoint and replay evidence validation.
- Lineage verification for parent-child continuity and orphan detection.
- Governance, constitutional, policy, and authority reference verification.
- Tenant isolation verification across hashes, replay references, lineage, and governance references.
- Confidence scoring, repair recommendations, verification records, and certification evidence.
- Fail-closed certification blocking for critical or untrusted verification states.

## API Surface

- `GET /api/integrity-verification-service/contract`
- `POST /api/integrity-verification-service/run`
- `POST /api/integrity-verification-service/validate`
- `POST /api/integrity-verification-service/classify`
- `POST /api/integrity-verification-service/results`
- `POST /api/integrity-verification-service/evidence`
- `GET|POST /api/integrity-verification-service/inspect`

## Verification States

- `VERIFIED`: integrity confirmed.
- `MONITORING`: active verification with no confirmed failure.
- `WARNING`: minor anomaly detected.
- `DEGRADED`: recoverable integrity issue detected.
- `FAILED`: verification failed.
- `CERTIFICATION_BLOCKED`: production certification must be blocked.
- `INVALID`: autonomous history cannot be trusted.

The service recommends repair actions only. It does not rewrite autonomous history.
