# Phase 7A.4 Governance Intelligence Lifecycle

## Purpose

Phase 7A.4 tracks Governance Intelligence from creation through archival.

The lifecycle layer coordinates the 7A.1 contract, 7A.2 state machine, and 7A.3 identity layer into an append-only, replayable, operator-visible lifecycle history.

## Lifecycle Stages

- Creation -> `CREATED`
- Analysis -> `ANALYZING`
- Correlation -> `CORRELATED`
- Recommendation Generation -> `RECOMMENDING`
- Escalation -> `ESCALATED`
- Certification -> `CERTIFIED`
- Archival -> `ARCHIVED`

The standard path is Creation, Analysis, Correlation, Recommendation Generation, Certification, Archival.

The escalation path is Creation, Analysis, Correlation, Recommendation Generation, Escalation, Certification, Archival.

## Lifecycle Events

Every lifecycle movement records:

- identity, tenant, and mission
- lifecycle stage
- from and to state
- timestamp, actor, actor type, and event source
- activity type and summary
- evidence, policy, lineage, and replay references
- recommendation, escalation, and certification references
- previous lifecycle hash
- lifecycle event hash
- resulting state hash
- validation status and failure reason
- Truth Ledger reference

Failed lifecycle attempts are also recorded because they are governance evidence.

## Validation

The lifecycle validator fails closed on:

- missing stages
- skipped stages
- stage regression
- invalid state transitions
- missing evidence, policy, lineage, or replay refs
- unsupported recommendations
- escalation without reason or references
- certification without pass status or certification refs
- archival before certification
- archived record mutation
- replay hash mismatch

## Replay

Lifecycle replay reconstructs the lifecycle path, state path, recommendation history, escalation history, certification status, archive status, and event hashes from recorded lifecycle events.

Replay fails closed when lifecycle hashes, state path, event order, or final state cannot be reproduced.

## Observability

The lifecycle surface exposes:

- current lifecycle stage
- current state
- stage timeline
- state path
- actor timeline
- evidence trace
- policy trace
- lineage trace
- replay trace
- recommendation history
- escalation history
- certification result
- archive status
- failure reasons

## API

7A.4 adds these authenticated routes:

- `GET|POST /api/governance-intelligence/lifecycle`
- `POST /api/governance-intelligence/lifecycle/transition`
- `POST /api/governance-intelligence/lifecycle/replay`

## Exit Criteria

7A.4 is complete when every lifecycle stage maps to a valid state, lifecycle events are recorded with required refs and hashes, recommendation and escalation history are preserved, lifecycle replay reconstructs the same path, invalid movement fails closed, archival is final, and the lifecycle test suite passes.
