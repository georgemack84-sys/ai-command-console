# Phase 7E.4 - Recommendation Validation

Phase 7E.4 adds the deterministic validation gate for Governance Recommendation Intelligence. It accepts generated recommendations and 7E.3 alternative paths, then classifies the result as `VALIDATED`, `CONDITIONAL_VALIDATION`, `REJECTED`, or `BLOCKED`.

## Scope

The validation layer verifies that every recommendation is:

- contract-valid
- evidence-backed
- risk-aware
- confidence-justified
- governance-compliant
- constitutionally permitted
- tenant-safe
- Truth Ledger-linked
- replay-ready
- advisory-only
- operator-visible

The validator does not execute recommendations, mutate policy, approve controls, deploy changes, grant authority, or change certification state.

## Validation Areas

The service produces area results for:

- `contract`
- `evidence`
- `risk`
- `confidence`
- `governance`
- `advisory_only`
- `alternative_path`
- `tenant_isolation`
- `replay_readiness`
- `truth_ledger`

Each area emits `PASS`, `WARNING`, `FAIL`, or `BLOCK` with findings, rationale, evidence references, replay references, and corrective references.

## Decision Rules

Overall decisions are derived deterministically:

- Any `BLOCK` yields `BLOCKED`.
- Any `FAIL` yields `REJECTED`.
- Only `WARNING` findings yield `CONDITIONAL_VALIDATION`.
- All `PASS` yields `VALIDATED`.

Conditional validation is only used for non-critical operator-review gaps. It cannot mask advisory-only failures, tenant isolation failures, constitutional conflicts, replay blockers, or ledger mutation attempts.

## APIs

The authenticated API surface is available under `/api/recommendation-validation`:

- `GET /contract`
- `POST /generate`
- `POST /validate`
- `POST /replay`
- `POST /hash`
- `GET|POST /inspect`

## Replay And Ledger

Validation results include a deterministic `validation_hash`, replay references, Truth Ledger references, and a validation ledger record. Replay recomputes the validation hash and fails on mismatch.

## Certification Coverage

The unit suite covers:

- valid recommendations accepted
- conditional recommendations flagged for operator review
- missing contract rejected
- unsupported recommendations rejected
- evidence gaps rejected
- risk gaps rejected
- critical risk without escalation blocked
- unsupported and inflated confidence rejected
- policy violations rejected
- constitutional conflicts blocked
- missing preferred, conservative, escalation, and remediation paths rejected
- path evidence, confidence, ordering, and comparison failures detected
- execution and mutation authority blocked
- cross-tenant references blocked
- missing replay refs rejected
- replay-impossible recommendations blocked
- missing ledger linkage rejected
- ledger mutation attempts blocked
- validation hash replay and mismatch detection

## Exit State

7E.4 is complete when the validation contract, service, routes, observability surface, replay check, ledger record, and certification tests pass with the prior 7E chain.
