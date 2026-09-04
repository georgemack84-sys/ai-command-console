# Governed Knowledge Retrieval

- Phase: Phase 0, Part X
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)
- Input dependency: durable admission, supersession, and exception relationships

## Purpose

Retrieval determines which governed knowledge is applicable to a scoped request. It reads durable knowledge; it does not write, authorize, execute, or amend it.

```text
Request scope and query
  -> active scope-matched candidates
  -> one deterministic base record
  -> active exception evaluation
  -> applicable knowledge or fail-closed result
```

## Rules

- Only `ACTIVE` records can be normally retrieved. Superseded records remain readable by identifier for history but yield `KNOWLEDGE_NOT_ACTIVE` for normal applicability.
- Scope identity must match exactly. A known record in another scope yields `OUT_OF_SCOPE`.
- An unqualified query with multiple candidates yields `AMBIGUOUS`; the service never selects by recency or confidence.
- When an active exception relationship exists, missing context yields `INSUFFICIENT_CONTEXT`. A context fact exactly matching its normalized applicability condition selects the exception; known non-matching facts leave the base record applicable.
- Multiple matching exceptions yield `AMBIGUOUS`.

## Guardrail

```text
Retrieval identifies knowledge.
Retrieval does not grant authority, execution permission, or persistence rights.
```
