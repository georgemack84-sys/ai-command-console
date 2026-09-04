# Knowledge Exception Lifecycle

- Phase: Phase 0, Part IX
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)
- Input dependency: Durable Knowledge Admission and an explicit `CREATES_EXCEPTION` comparison

## Purpose

An exception narrows the applicability of an active base record under an explicit condition. It neither replaces nor alters that base record.

```text
Base knowledge      -> remains ACTIVE
Exception knowledge -> remains ACTIVE
Exception relation  -> constrains applicability by condition
```

## Preconditions

The base and exception records must both exist and be active. The exception must be classified as `EXCEPTION`, preserve an admitted `CREATES_EXCEPTION` lineage, identify the base through conflict detection, use a compatible scope identity, provide non-empty applicability condition, and preserve policy, constitution, provenance, and authority neutrality.

## Registration and audit

`KnowledgeException` is a typed, durable relationship rather than an overwrite or implicit priority rule. Registration and `KNOWLEDGE_EXCEPTION_REGISTERED` audit emission are separate governed boundaries; production adapters must make their durable transition and audit emission transactional.

The exception knowledge ID is the idempotency key. A repeat returns the existing relationship and produces no duplicate audit event.

## Guardrails

```text
Exception != supersession
Exception != hidden override
Exception != broader scope promotion
Exception != authority change
Exception != execution permission
```

Part IX records a relationship only. Contextual resolution of whether an exception applies belongs to the later retrieval layer.
