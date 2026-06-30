# Phase 8H.3 - Tamper Detection Engine

The Tamper Detection Engine continuously monitors the autonomous integrity stack for unauthorized modification, corruption, replay manipulation, lineage inconsistency, execution divergence, and governance-reference loss.

## Delivered Capabilities

- Integrity scanner over the 8H.2 Autonomous Hash Chain Engine.
- Tamper classification across hash, artifact, replay, lineage, execution, and governance integrity.
- Corruption reports with affected artifacts, scope, and recovery recommendation.
- Replay verification and lineage analysis derived from chain evidence.
- Historical consistency checks for chronology, lifecycle ordering, governance continuity, authority continuity, and replay continuity.
- Governance-aware alerting with severity from `INFORMATION` through `CRITICAL`.
- Repair recommendations, governance notifications, and forensic evidence hashes.
- Fail-closed certification readiness whenever confirmed corruption or invalid execution divergence appears.

## API Surface

- `GET /api/tamper-detection-engine/contract`
- `POST /api/tamper-detection-engine/run`
- `POST /api/tamper-detection-engine/validate`
- `POST /api/tamper-detection-engine/classify`
- `POST /api/tamper-detection-engine/alerts`
- `POST /api/tamper-detection-engine/report`
- `POST /api/tamper-detection-engine/recommendations`
- `GET|POST /api/tamper-detection-engine/inspect`

## Detection States

- `CLEAN`: no active integrity violation.
- `WARNING`: anomaly without confirmed corruption.
- `DEGRADED`: recoverable integrity inconsistency.
- `CORRUPTED`: confirmed tampering or corruption.
- `INVALID`: integrity cannot be trusted and certification fails closed.

The engine is deterministic: identical inputs produce identical detections, alerts, reports, recommendations, notifications, and forensic evidence.
