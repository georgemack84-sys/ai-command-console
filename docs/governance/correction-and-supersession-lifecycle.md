# Correction and Supersession Lifecycle

- Phase: Phase 0, Part VIII
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)
- Input dependency: Durable Knowledge Admission and an explicit `CORRECTS` comparison

## Purpose

Supersession applies an accepted correction to one existing active knowledge record without rewriting or deleting history.

```text
Prior ACTIVE knowledge -> SUPERSEDED
Replacement CORRECTION knowledge -> remains ACTIVE
```

The typed `KnowledgeSupersession` relationship records why the transition occurred, when, under which policy and constitution versions, and with which replacement record.

## Preconditions

The service requires an existing active prior record, an existing active replacement record classified as `CORRECTION`, compatible scope identities, an explicit `CORRECTS` conflict result whose target is the prior record, and an admitted correction lineage. Missing or inconsistent input is rejected before mutation.

## Atomic transition and audit

The lifecycle repository exposes a single `supersede` operation that updates the prior lifecycle state and records the relationship as one in-memory transition. The service then appends a `KNOWLEDGE_SUPERSEDED` audit event. Production adapters must make the state transition and audit emission transactional.

Repeated requests use the replacement knowledge ID as the idempotency key. They return the existing relationship without changing records or emitting a duplicate event.

## Guardrails

```text
Correction detection != supersession
Supersession != overwrite
Superseded != deleted
Different scope != valid target
Supersession != authority change
```

Part VIII does not implement exception lifecycle, retrieval, deletion, forgetting, execution, or authority management.
