# Phase 7F.1 - Escalation Contract

Phase 7F.1 defines the canonical deterministic contract for governance escalation records in Mission Control.

## Scope

The contract governs:

- escalation identity
- escalation type and category
- deterministic trigger definition
- deterministic severity definition
- deterministic routing definition
- evidence and Truth Ledger references
- governance context
- confidence metadata
- lineage references
- replay metadata
- certification metadata
- advisory-only authority boundaries
- append-only lifecycle state

It does not decide whether escalation should occur. Detection belongs to Phase 7F.2.

## Supported Types

Supported escalation types are:

- `CONSTITUTIONAL`
- `AUTHORITY`
- `POLICY`
- `COMPLIANCE`
- `GOVERNANCE`
- `RISK`
- `RECOMMENDATION`
- `EVIDENCE`
- `REPLAY`
- `OPERATIONAL`

## Validation

The validator fails closed for:

- missing or unsupported triggers
- invalid severity
- missing routing target
- incomplete evidence
- broken lineage
- missing governance context
- unsupported confidence metadata
- replay mismatch
- missing Truth Ledger reference
- execution authority
- authority expansion
- cross-tenant references
- immutable identity mutation
- hidden state
- escalation hash mismatch

## APIs

Authenticated routes are exposed under `/api/escalation-contract`:

- `GET /contract`
- `POST /validate`
- `POST /hash`
- `POST /replay`
- `POST /transition`
- `GET|POST /inspect`

## Exit State

7F.1 is complete when the schema, builder, validation rules, replay, hash, lifecycle transitions, observability surface, API routes, documentation, and unit tests pass.
