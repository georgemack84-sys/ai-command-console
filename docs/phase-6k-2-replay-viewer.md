# Phase 6K.2 Replay Viewer

## Purpose

Phase 6K.2 adds the operator-facing Replay Viewer for governed inspection of replay artifacts.

The viewer is read-only. It does not rerun replay, mutate replay artifacts, modify truth records, replace evidence, rewrite lineage, approve recommendations, execute decisions, or override governance.

## Delivered Components

- `ReplayViewerContract`
- `ReplayViewerRecord`
- `ReplaySummaryDisplay`
- `InputReconstructionDisplay`
- `StateReconstructionDisplay`
- `OutputVerificationDisplay`
- `ReplayMismatchAnalysis`
- `IncompleteReplayDisplay`
- `InvalidReplayDisplay`
- `DeterminismGateDisplay`
- `ReplayTimelineEvent`
- `ReplayDiffDisplay`
- `ReplayViewerAuditEvent`
- `ReplayViewerView`
- `buildReplayViewerContract`
- `queryReplayViewerRecords`
- `buildReplayViewerDetail`
- `buildReplayViewerView`
- `createReplayViewerAuditEvent`
- `assertReplayViewerActionBlocked`
- Replay Viewer page at `/replay-viewer`
- Read-only API routes under `/api/replay-viewer`

## API Surface

- `GET /api/replay-viewer/replays`
- `GET /api/replay-viewer/replays/:replay_id`
- `GET /api/replay-viewer/replays/:replay_id/summary`
- `GET /api/replay-viewer/replays/:replay_id/input-reconstruction`
- `GET /api/replay-viewer/replays/:replay_id/state-reconstruction`
- `GET /api/replay-viewer/replays/:replay_id/output-verification`
- `GET /api/replay-viewer/replays/:replay_id/mismatch-analysis`
- `GET /api/replay-viewer/replays/:replay_id/incomplete`
- `GET /api/replay-viewer/replays/:replay_id/invalid`
- `GET /api/replay-viewer/replays/:replay_id/determinism`
- `GET /api/replay-viewer/replays/:replay_id/timeline`
- `GET /api/replay-viewer/replays/:replay_id/diff`
- `GET /api/replay-viewer/replays/:replay_id/evidence-lineage`
- `GET /api/replay-viewer/replays/:replay_id/governance`
- `GET /api/replay-viewer/replays/:replay_id/integrity`
- `POST /api/replay-viewer/audit-events`

## Guardrails

The Replay Viewer enforces:

- tenant isolation
- operator access verification
- restricted replay redaction or denial
- deterministic replay query ordering
- mismatch visibility
- incomplete replay warnings
- invalid replay trust blocking
- evidence, lineage, governance, and integrity context visibility
- append-only audit events
- no replay mutation, truth-record mutation, evidence modification, lineage rewrite, replay rerun, approval, execution, or governance override

## Exit Criteria

6K.2 is complete when operators can inspect replay success, mismatch, incompleteness, invalidity, inputs, reconstructed state, output comparison, determinism, evidence, lineage, governance context, and integrity status through a governed read-only surface.
