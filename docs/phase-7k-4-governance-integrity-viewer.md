# Phase 7K.4 Governance Integrity Viewer

Phase 7K.4 adds a read-only Governance Integrity Viewer for certified Governance Integrity Framework output.

## Delivered

- Deterministic integrity viewer contract and service at `services/governance-integrity-viewer`.
- Typed integrity view model in `types/governance-integrity-viewer.ts`.
- Authenticated API endpoints under `app/api/governance-integrity-viewer`.
- Operator UI at `/governance-integrity-viewer`.
- Focused unit coverage for doctrine, integrity states, hash chain display, verification results, tamper alerts, timeline, trust indicators, observability, and prohibited actions.

## Guarantees

- The viewer is read-only and advisory-only.
- Hash repair, hash recalculation, verification mutation, history alteration, and governance overrides are blocked.
- Hashes, verification results, tamper alerts, trends, trust indicators, and certification history are rendered from Phase 7I.5 certification data.
- VALID, DEGRADED, and CORRUPTED integrity states are represented deterministically.
- Tenant isolation and authorization enforcement are explicit on the view and API surface.
