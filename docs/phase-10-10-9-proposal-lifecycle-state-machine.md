# Phase 10.10.9 - Proposal Lifecycle State Machine

## Purpose

The Proposal Lifecycle State Machine governs deterministic proposal workflow progression across the complete adaptation proposal lifecycle.

It controls proposal state only. It never modifies proposal content, bypasses governance, bypasses certification, authorizes implementation, performs deployment, or changes production behavior.

## Tightened Contract

- Every proposal has exactly one lifecycle state at a time.
- Every transition is validated against canonical allowed transitions.
- Invalid transitions are rejected and emitted as audit events.
- Governance, constitutional, authority, replay, integrity, and tenant checks precede every accepted transition.
- Lifecycle history is immutable and replayable from the Adaptation Proposal Ledger.
- Certification marks certification readiness only and never implies deployment.

## API Surface

- `POST /proposal-lifecycle-state-machine/evaluate`
- `POST /proposal-lifecycle-state-machine/transitions`
- `POST /proposal-lifecycle-state-machine/states`
- `POST /proposal-lifecycle-state-machine/metrics`
- `POST /proposal-lifecycle-state-machine/replay`
- `POST /proposal-lifecycle-state-machine/inspect`
- `GET /proposal-lifecycle-state-machine/contract`

## Canonical States

- `DRAFT`
- `VALIDATED`
- `REQUIRES_SIMULATION`
- `REQUIRES_GOVERNANCE_REVIEW`
- `REQUIRES_OPERATOR_REVIEW`
- `APPROVED_FOR_CERTIFICATION`
- `CERTIFIED`
- `REJECTED`
- `SUPPRESSED`
- `ROLLED_BACK`
- `ARCHIVED`

## Failure Behavior

Lifecycle evaluation fails closed for invalid current states, unauthorized destinations, incomplete prerequisites, governance failure, constitutional failure, authority violations, replay failure, integrity failure, nondeterministic transition ordering, tenant isolation violations, closed-state reactivation attempts, bypass attempts, lifecycle rewrites, state overwrites, proposal mutation attempts, implementation authorization attempts, and automatic deployment attempts.

## Verification

The focused unit suite validates canonical states, allowed transitions, canonical and alternate paths, illegal transition audit events, lifecycle metrics, advisory-only guarantees, fail-closed behavior, and replay tamper detection.
