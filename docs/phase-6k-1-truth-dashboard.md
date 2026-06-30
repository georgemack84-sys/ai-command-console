# Phase 6K.1 Truth Dashboard

## Purpose

Phase 6K.1 introduces the operator-facing Truth Dashboard for governed inspection of Truth Ledger records.

The dashboard is a visibility surface only. It does not create, modify, approve, execute, delete, override governance, or mutate lineage, evidence, recommendations, or decisions.

## Delivered Components

- `TruthDashboardContract`
- `TruthDashboardRecord`
- `RecommendationDisplay`
- `DecisionDisplay`
- `EvidenceDisplay`
- `LineageDisplay`
- `DashboardReplayLink`
- `TruthDashboardAuditEvent`
- `TruthDashboardQuery`
- `TruthDashboardView`
- `buildTruthDashboardContract`
- `queryTruthDashboardRecords`
- `buildTruthDashboardRecordDetail`
- `buildTruthDashboardView`
- `createTruthDashboardAuditEvent`
- `assertTruthDashboardActionBlocked`
- Truth Dashboard page at `/truth-dashboard`
- Read-only API routes under `/api/truth-dashboard`

## API Surface

- `GET /api/truth-dashboard/records`
- `GET /api/truth-dashboard/records/:truth_record_id`
- `GET /api/truth-dashboard/records/:truth_record_id/recommendations`
- `GET /api/truth-dashboard/records/:truth_record_id/decisions`
- `GET /api/truth-dashboard/records/:truth_record_id/evidence`
- `GET /api/truth-dashboard/records/:truth_record_id/lineage`
- `GET /api/truth-dashboard/records/:truth_record_id/replay`
- `GET /api/truth-dashboard/records/:truth_record_id/integrity`
- `POST /api/truth-dashboard/audit-events`

## Guardrails

The dashboard enforces:

- read-only access
- tenant isolation
- operator access matching
- restricted record redaction or denial
- deterministic query ordering
- visible integrity warnings
- replay reference visibility
- append-only audit events
- no mutation, approval, execution, evidence modification, lineage rewrite, or governance override actions

## Operator Surface

The page exposes:

- searchable truth record table
- record-type filters
- unified truth record detail view
- recommendation context
- decision context
- evidence context
- lineage context
- integrity indicators
- replay references
- governance restriction and corruption warnings

## Exit Criteria

6K.1 is complete when operators can inspect recommendations, decisions, evidence, and lineage through a governed, read-only, tenant-scoped, replay-aware dashboard that preserves Truth Ledger integrity and fails closed on unsafe access.
