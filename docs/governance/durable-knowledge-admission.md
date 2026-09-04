# Durable Knowledge Admission

- Phase: Phase 0, Part VII
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)
- Input dependencies: Parts II–VI

## Purpose

This is the first Phase 0 component authorized to create durable knowledge. It requires a complete, consistent lineage ending in an `ACCEPT` decision with `durableAdmissionEligible = true`.

```text
Observation -> Classification -> Scope -> Conflict -> Validation -> Decision -> Admission
```

`ACCEPT` is not persistence. Admission is the distinct state transition that creates one authoritative `ACTIVE` knowledge record and one audit event.

## Record and lifecycle

The authoritative record contains stable knowledge and candidate IDs, content, canonical classification, exact scope, `ACTIVE` lifecycle state, effective time, provenance, lineage references, policy version, and constitution version.

The broader lifecycle vocabulary also reserves `SUPERSEDED`, `ARCHIVED`, and `QUARANTINED`. Part VII only creates `ACTIVE`; supersession, archival, expiration, revocation, and forgetting remain later operations.

## Authoritative store and audit ledger

`KnowledgeRepository` exposes only `create`, `getById`, and `findByCandidateId`. `KnowledgeAuditLedger` appends `KNOWLEDGE_ADMITTED` events and reads them by knowledge ID. The Phase 0 in-memory implementations are deterministic testing adapters, not a production database design.

Embeddings, full-text indexes, vector stores, and graph projections are not authoritative stores and are outside this part.

## Admission requirements

Admission fails closed unless the decision is `ACCEPT`, admission eligibility is true, the scope is resolved, every candidate identity agrees, provenance agrees across upstream stages, policy and constitution versions are present, and no upstream stage indicates an authority or execution-permission effect.

The candidate ID is the idempotency key. A replay of the same accepted candidate returns the original record and reports `persistenceEffect = NONE`; it never creates a second active record or audit event.

## Side effects

Only successful first admission returns:

```text
persistenceEffect = CREATED
authorityEffect = UNCHANGED
executionPermissionGranted = false
```

Repository or audit failure returns `PERSISTENCE_FAILED` and never claims that learning succeeded. Production adapters must preserve record creation and audit emission transactionally.

## Non-goals

Part VII does not resolve conflict, supersede existing records, perform retrieval, build indexes, grant authority, execute procedures, delete knowledge, or learn automatically from conversation.
