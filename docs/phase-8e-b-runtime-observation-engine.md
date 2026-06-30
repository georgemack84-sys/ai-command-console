# Phase 8E.B - Runtime Observation Engine

## Purpose

The Runtime Observation Engine is the primary sensing layer of Runtime Supervision. It continuously observes autonomous execution and produces deterministic, governance-aware runtime observations without influencing execution behavior.

## Delivered

- Runtime Observation Engine: `services/runtime-observation-engine`
- Canonical observation types: `types/runtime-observation-engine.ts`
- Observation normalization, supervision event generation, monitoring timeline, evidence builder, validation, replay, and dashboard projection
- API routes under `/api/runtime-observation-engine`
- Unit coverage in `tests/unit/runtime-observation-engine/runtimeObservationEngine.test.ts`

## API Surface

- `GET /api/runtime-observation-engine/contract`
- `POST /api/runtime-observation-engine/observe`
- `POST /api/runtime-observation-engine/validate`
- `POST /api/runtime-observation-engine/replay`
- `POST /api/runtime-observation-engine/evidence`
- `POST /api/runtime-observation-engine/timeline`
- `GET /api/runtime-observation-engine/inspect`
- `POST /api/runtime-observation-engine/inspect`

## Guarantees

- Read-only observation with no execution, governance, or authority mutation
- Deterministic observation hashes, supervision event hashes, evidence hashes, timeline hashes, package hashes, and replay reconstruction
- Tenant-isolated observations with replay and lineage references
- Immutable runtime evidence for Truth Ledger integration
- Fail-closed validation for incomplete observations, missing governance/authority/confidence/health/recommendation signals, missing events, incomplete timelines, replay mismatch, tenant violations, failed Truth Ledger persistence, hidden channels, and hash tampering
