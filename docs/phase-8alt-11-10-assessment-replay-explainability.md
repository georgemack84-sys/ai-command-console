# Phase 8ALT.11.10 - Assessment Replay & Explainability

## Purpose

Phase 8ALT.11.10 reconstructs maturity assessments from the immutable analytics, ledger, evidence, lineage, replay, scoring, classification, readiness, and recommendation artifacts produced by prior Phase 8ALT.11 services.

Replay is read-only. It reconstructs and compares artifacts, generates explanations, detects divergence, and produces audit/certification data packages without modifying records or re-authorizing any maturity, certification, governance, constitutional, or runtime behavior.

## Outputs

- reconstructed assessment context
- replay output
- divergence findings
- operator-readable explanations
- replay audit report
- replay certification package
- validation result
- observability surface

## Validation

Validation verifies exact replay output, evidence presence, evidence integrity, scoring/classification/recommendation rule availability, governance and constitutional evidence, lineage, hidden logic prevention, tenant isolation, and read-only behavior.

## API Surface

- `GET /api/assessment-replay-explainability/replay`
- `POST /api/assessment-replay-explainability/replay`
- `POST /api/assessment-replay-explainability/explain`
- `POST /api/assessment-replay-explainability/audit`
- `POST /api/assessment-replay-explainability/package`
- `POST /api/assessment-replay-explainability/validate`
- `GET /api/assessment-replay-explainability/inspect`
- `POST /api/assessment-replay-explainability/inspect`
