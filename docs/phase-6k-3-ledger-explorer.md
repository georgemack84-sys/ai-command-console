# Phase 6K.3 Ledger Explorer

## Purpose

Phase 6K.3 adds the operator-facing Ledger Explorer for governed navigation across the Truth Ledger.

The explorer is read-only. It does not create, edit, delete, approve, execute, modify evidence, rewrite lineage, repair hash chains, or override governance.

## Delivered Components

- `LedgerExplorerContract`
- `LedgerExplorerRecord`
- `LedgerTimelineEvent`
- `LedgerGraphNode`
- `LedgerGraphEdge`
- `LedgerRecordDrilldown`
- evidence, recommendation/decision, governance, runtime, integrity, archive, historical, and cross-ledger explorer records
- `LedgerExplorerView`
- `buildLedgerExplorerContract`
- `queryLedgerExplorerRecords`
- `buildLedgerExplorerDetail`
- `buildLedgerExplorerView`
- `createLedgerExplorerAuditEvent`
- `assertLedgerExplorerActionBlocked`
- Ledger Explorer page at `/ledger-explorer`
- Read-only API routes under `/api/ledger-explorer`

## API Surface

- `GET /api/ledger-explorer/records`
- `GET /api/ledger-explorer/records/:truth_record_id`
- `GET /api/ledger-explorer/records/:truth_record_id/drilldown`
- `GET /api/ledger-explorer/records/:truth_record_id/timeline`
- `GET /api/ledger-explorer/records/:truth_record_id/graph`
- `GET /api/ledger-explorer/records/:truth_record_id/lineage`
- `GET /api/ledger-explorer/records/:truth_record_id/evidence`
- `GET /api/ledger-explorer/records/:truth_record_id/recommendations-decisions`
- `GET /api/ledger-explorer/records/:truth_record_id/governance`
- `GET /api/ledger-explorer/records/:truth_record_id/runtime-events`
- `GET /api/ledger-explorer/records/:truth_record_id/integrity`
- `GET /api/ledger-explorer/records/:truth_record_id/replay`
- `GET /api/ledger-explorer/records/:truth_record_id/archive`
- `GET /api/ledger-explorer/historical-reconstruction`
- `GET /api/ledger-explorer/cross-ledger-correlations`
- `POST /api/ledger-explorer/audit-events`

## Guardrails

The Ledger Explorer enforces tenant isolation, operator access verification, restricted-record redaction or denial, deterministic ordering, stable graph construction, integrity and hash-chain warnings, historical reconstruction warnings, append-only audit events, and fail-closed behavior.

## Exit Criteria

6K.3 is complete when operators can browse records, timeline history, graph relationships, evidence, recommendation-decision chains, governance, runtime events, replay references, integrity chains, archive state, historical reconstruction, and authorized cross-ledger correlations through a governed read-only explorer.
