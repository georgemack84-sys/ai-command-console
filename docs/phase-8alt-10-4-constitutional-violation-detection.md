# Phase 8ALT.10.4 - Constitutional Violation Detection

The Constitutional Violation Detection Engine provides deterministic detection of constitutional violations across authority, governance, constitutional controls, hidden execution, replay, learning, optimization, drift, integrity, policy, and tenant isolation domains.

The implementation is detection-only and advisory-only. Critical and blocking findings produce immutable fail-closed requirements, evidence packages, ledger records, and operator/governance alerts, but never perform autonomous remediation, execution modification, authority grants, or governance overrides.

## Surfaces

- `detectConstitutionalViolations` builds the repository.
- `listConstitutionalViolationRecords` exposes deterministic violation observations.
- `listConstitutionalSeverityClassifications` returns reproducible severity and response priority.
- `listConstitutionalViolationEvidence` returns forensic evidence packages.
- `listConstitutionalViolationLedger` returns append-only immutable ledger records.
- `listConstitutionalViolationAlerts` returns operator and governance alert payloads.
- `validateConstitutionalViolationDetection` validates replay, evidence, lineage, integrity, tenant isolation, and no-authority guarantees.

## API

- `GET /api/constitutional-violation-detection/detect`
- `POST /api/constitutional-violation-detection/detect`
- `POST /api/constitutional-violation-detection/violations`
- `POST /api/constitutional-violation-detection/classifications`
- `POST /api/constitutional-violation-detection/evidence`
- `POST /api/constitutional-violation-detection/ledger`
- `POST /api/constitutional-violation-detection/alerts`
- `POST /api/constitutional-violation-detection/validate`
- `GET|POST /api/constitutional-violation-detection/inspect`

## Authority Boundary

Fail-closed is represented as required governance/operator review. The engine does not halt execution directly and does not mutate governance, runtime, policy, recovery, optimization, learning, or mission state.
