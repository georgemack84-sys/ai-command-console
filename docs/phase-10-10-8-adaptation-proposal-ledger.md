# Phase 10.10.8 - Adaptation Proposal Ledger

## Purpose

The Adaptation Proposal Ledger is the append-only system of record for adaptive proposal lifecycle history.

It records proposal events, lineage references, replay references, sequence numbers, previous hashes, and cryptographic entry hashes. It records history only and never mutates proposals, rewrites history, deletes entries, authorizes implementation, or changes production behavior.

## Tightened Contract

- Every ledger entry is immutable, append-only, tenant-scoped, sequence-numbered, and hash-linked to the previous entry.
- The ledger records creation, validation, scoring, prioritization, suppression, consolidation, simulation routing, governance review, operator review, certification routing, approval, rejection, rollback planning, and archival.
- Hash-chain continuity, replay references, lineage references, sequence ordering, tenant isolation, and integrity hashes are validated before commit.
- Invalid ledger inputs fail closed and produce no committed entries.
- Query indexes are deterministic and tenant-isolated.

## API Surface

- `POST /adaptation-proposal-ledger/commit`
- `POST /adaptation-proposal-ledger/entries`
- `POST /adaptation-proposal-ledger/query`
- `POST /adaptation-proposal-ledger/metrics`
- `POST /adaptation-proposal-ledger/replay`
- `POST /adaptation-proposal-ledger/inspect`
- `GET /adaptation-proposal-ledger/contract`

## Lifecycle Events

- `PROPOSAL_CREATED`
- `PROPOSAL_VALIDATED`
- `PROPOSAL_SCORED`
- `PROPOSAL_PRIORITIZED`
- `PROPOSAL_SUPPRESSED`
- `PROPOSAL_CONSOLIDATED`
- `SIMULATION_ROUTED`
- `GOVERNANCE_REVIEWED`
- `OPERATOR_REVIEWED`
- `CERTIFICATION_ROUTED`
- `APPROVAL_RECORDED`
- `REJECTION_RECORDED`
- `ROLLBACK_PLANNED`
- `ARCHIVED`

## Failure Behavior

Commit fails closed for proposal validation failures, integrity failures, hash failures, sequence breaks, incomplete replay or lineage references, duplicate event identifiers, nondeterministic ordering, tenant isolation violations, event authenticity failures, history rewrites, entry removal attempts, bypass attempts, cross-tenant records, and implementation authorization attempts.

## Verification

The focused unit suite validates lifecycle coverage, append-only behavior, hash-chain continuity, lineage and replay reference preservation, deterministic query indexes, observability metrics, advisory-only guarantees, fail-closed behavior, and replay tamper detection.
