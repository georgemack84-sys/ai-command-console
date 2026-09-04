# Conflict Detection Model

- Phase: Phase 0, Part IV
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)
- Input dependencies: [Information Classification Model](information-classification-model.md) and [Knowledge Scope Model](knowledge-scope-model.md)

## Purpose

Conflict detection compares a classified, scoped candidate with one existing knowledge record and returns an explainable relationship. Its invariant is:

> New information must not silently overwrite existing knowledge.

The detector is analytical only. It does not validate truth, resolve a conflict, supersede a record, create an exception, persist state, or alter authority.

## Typed relationships

The canonical relationship model is `AGREES`, `DUPLICATES`, `REINFORCES`, `EXTENDS`, `REFINES`, `QUALIFIES`, `NARROWS`, `CONTRADICTS`, `CORRECTS`, `CREATES_EXCEPTION`, `UNRELATED`, and `UNCERTAIN`.

Part IV deterministically assesses exact duplicates, same-key agreement, structured value mismatches, qualifier refinement/qualification/narrowing, and explicit correction or exception references. The remaining relationship types are reserved for later semantic enrichment; their presence in the taxonomy does not authorize inference.

## Scope-first comparison

Scope compatibility is evaluated before content comparison. Incompatible scope identities return:

```text
relationship = UNRELATED
status = OUT_OF_SCOPE
```

For example, Project Alpha choosing PostgreSQL and Project Beta choosing SQLite are not a conflict. Scope incompatibility does not mean either record is false; it excludes the pair from conflict evaluation.

## Conservative comparison

The detector relies on explicit semantic keys and values for potential contradictions. A same-scope candidate and existing record with missing keys or values returns `UNCERTAIN` and requests clarification. It never guesses a supersession.

Corrections require an explicit `supersedesKnowledgeIds` reference to the existing record. Exceptions require an explicit `exceptionToKnowledgeIds` reference. Both return validation and approval requirements, but do not mutate either record.

## Result and side effects

Every result includes both record IDs, relationship, confidence, scope compatibility, provenance, safe rationale metadata, lifecycle reference hints, and downstream requirements. Every result has:

```text
persistenceEffect = NONE
authorityEffect = UNCHANGED
```

The later lifecycle and approval components own correction, supersession, exception admission, conflict resolution, and durable state transitions.

## Guardrails

```text
Different scope != conflict
Potential conflict != confirmed contradiction
Correction detection != supersession
Exception detection != rule replacement
Conflict detection != persistence
Confidence != authority
```
