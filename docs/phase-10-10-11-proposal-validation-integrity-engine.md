# Phase 10.10.11 - Proposal Validation & Integrity Engine

## Purpose

The Proposal Validation & Integrity Engine is the final deterministic quality gate before downstream governance review, simulation, certification, or operator approval workflows.

It validates proposals only. It never modifies proposal contents, changes scores, changes governance decisions, authorizes implementation, or changes production behavior.

## Tightened Contract

- Every validation checks identity, references, evidence, replay, integrity, tenant isolation, scoring, lineage, simulation routing, approval routing, and rollback availability.
- Every validation emits a deterministic validation report with completed checks, failed checks, warnings, integrity verification, replay verification, tenant isolation verification, and remediation.
- `may_progress_to_governance_review` is true only for a fully `VALID` report with no failed checks.
- Invalid, incomplete, conflicting, or review-required results fail closed.

## API Surface

- `POST /proposal-validation-integrity-engine/validate`
- `POST /proposal-validation-integrity-engine/reports`
- `POST /proposal-validation-integrity-engine/checks`
- `POST /proposal-validation-integrity-engine/metrics`
- `POST /proposal-validation-integrity-engine/replay`
- `POST /proposal-validation-integrity-engine/inspect`
- `GET /proposal-validation-integrity-engine/contract`

## Validation Categories

- `IDENTITY`
- `REFERENCES`
- `EVIDENCE`
- `REPLAY`
- `INTEGRITY`
- `TENANT_ISOLATION`
- `SCORING`
- `LINEAGE`
- `SIMULATION_ROUTING`
- `APPROVAL_ROUTING`
- `ROLLBACK_AVAILABILITY`

## Outcomes

- `VALID`
- `INVALID`
- `INCOMPLETE`
- `CONFLICTING`
- `REQUIRES_REVIEW`

## Failure Behavior

Validation fails closed for invalid contract or identity, missing references, evidence failure, replay failure, integrity failure, tenant isolation violation, scoring inconsistency, incomplete lineage, invalid simulation or approval routing, missing rollback requirements, nondeterministic validation, contradictory references, inconsistent routing, conflicting lineage, review-required ambiguity, proposal or score mutation attempts, fabricated validation, bypass attempts, and implementation authorization attempts.

## Verification

The focused unit suite validates deterministic reports, all validation categories, outcome assignment, governance readiness gating, metrics, advisory-only guarantees, fail-closed behavior, and replay tamper detection.
