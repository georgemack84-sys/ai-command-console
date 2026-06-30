# Phase 8C.6 - Checkpoint Manager

## Purpose

The Checkpoint Manager creates deterministic, immutable recovery points from monitored workflow execution. It preserves execution, workflow, dependency, resource, governance, authority, approval, rollback, replay, and lineage state so later recovery services can audit, replay, or prepare rollback from a certified point.

The manager does not perform recovery or rollback. Recovery remains disabled in every package and published recovery snapshot.

## Implementation

- `types/checkpoint-manager.ts` defines certified checkpoints, checkpoint registry records, recovery snapshots, validation results, replay results, and visibility surfaces.
- `services/checkpoint-manager/index.ts` creates checkpoints from `ExecutionMonitorPackage` data, links parent-child lineage, registers immutable records, publishes recovery snapshot metadata, verifies integrity hashes, and validates readiness for Phase 8C.7.
- `app/api/checkpoint-manager/*` exposes framework, capture, registry, validate, replay, and visibility endpoints behind workspace authentication.
- `tests/unit/checkpoint-manager/checkpointManager.test.ts` covers deterministic capture, complete state snapshots, registry and replay surfaces, tamper detection, tenant isolation, lineage continuity, and conditional retention warnings.

## Validation Rules

Checkpoint certification requires:

- valid upstream execution monitor certification
- complete execution, workflow, dependency, resource, governance, authority, and approval snapshots
- rollback and replay references for every checkpoint
- parent-child lineage continuity and ordered checkpoint sequences
- immutable registry records and intact integrity hashes
- tenant isolation preservation
- recovery and rollback remaining unexecuted

Retention policy gaps produce `CONDITIONAL_PASS`; all other detected failures produce `FAIL`.

## API Surface

- `GET /api/checkpoint-manager/framework`
- `POST /api/checkpoint-manager/capture`
- `POST /api/checkpoint-manager/registry`
- `POST /api/checkpoint-manager/validate`
- `POST /api/checkpoint-manager/replay`
- `POST /api/checkpoint-manager/visibility`

Request bodies may include a deterministic `scenario` value for validation and test coverage.

## Exit State

Phase 8C.6 is ready when checkpoints are deterministic, immutable, governance-aware, replay-compatible, lineage-preserving, integrity-protected, and prepared for rollback planning without enabling autonomous recovery.
