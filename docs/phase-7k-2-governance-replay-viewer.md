# Phase 7K.2 Governance Replay Viewer

Phase 7K.2 implements a deterministic, read-only Governance Replay Viewer.

## Scope

- Visualizes certified governance replay sessions.
- Displays replay inputs, outputs, evidence, reconstructed policies, risks, compliance, recommendations, escalations, timeline events, hashes, verification, and comparison data.
- Adds an operational page at `/governance-replay-viewer`.
- Exposes read-only API endpoints under `/api/governance-replay-viewer/*`.

## API Surface

- `GET /api/governance-replay-viewer/view`
- `GET /api/governance-replay-viewer/metadata`
- `GET /api/governance-replay-viewer/inputs`
- `GET /api/governance-replay-viewer/outputs`
- `GET /api/governance-replay-viewer/evidence`
- `GET /api/governance-replay-viewer/policies`
- `GET /api/governance-replay-viewer/risks`
- `GET /api/governance-replay-viewer/compliance`
- `GET /api/governance-replay-viewer/recommendations`
- `GET /api/governance-replay-viewer/escalations`
- `GET /api/governance-replay-viewer/timeline`
- `GET /api/governance-replay-viewer/hashes`
- `GET /api/governance-replay-viewer/verification`
- `GET /api/governance-replay-viewer/comparison`
- `GET /api/governance-replay-viewer/hash`

## Guardrails

The viewer cannot execute replay, modify replay artifacts, modify evidence, alter governance history, or override governance. It is strictly observational and advisory-only.

## Certification Notes

Viewer hashes, artifact hashes, timeline event hashes, comparison hashes, and verification hashes are deterministic. Identical certified replay inputs produce identical viewer output and ordering.
