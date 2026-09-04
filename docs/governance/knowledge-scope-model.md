# Knowledge Scope Model

- Phase: Phase 0, Part III
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)
- Input dependency: [Information Classification Model](information-classification-model.md)

## Purpose

Scope resolution determines the bounded context in which classified information may apply. Its permanent rule is:

> Unknown scope is not Global scope.

Scope is provisional evidence for later conflict, validation, and persistence decisions. Scope resolution does not persist knowledge, establish truth, promote information, or grant authority.

```text
Statement
  -> Classification
  -> Scope Determination
  -> Conflict Detection
  -> Validation
  -> Persistence Decision
```

## Canonical scopes and identity

Part III uses the canonical scope types `CONVERSATION`, `SESSION`, `USER`, `AGENT`, `PROJECT`, `WORKSPACE`, `ORGANIZATION`, `DOMAIN`, `SYSTEM`, and `GLOBAL`.

Conversation through Domain references require stable IDs. System and Global are root references without instance IDs. Display names and parent references assist explanation; they do not create automatic inheritance.

Examples:

```text
PROJECT:project-alpha
USER:operator-001
CONVERSATION:conversation-123
GLOBAL
```

## Conservative resolution order

The deterministic resolver evaluates evidence in this order:

1. unresolved classification produces unresolved scope;
2. a valid explicit scope resolves directly;
3. one known scope named in the content resolves to that identity;
4. multiple named scopes produce `CONFLICTING`;
5. broad language such as “always” or “all projects” produces `AMBIGUOUS` without explicit justification;
6. a classifier hint resolves only when exactly one active scope confirms it;
7. missing or competing evidence fails closed.

A classifier `scopeHint` is never a resolved scope by itself.

## Resolution result

Results contain an optional scope reference, confidence, status, evidence source, provenance, safe rationale metadata, clarification requirement, and whether a separate scope-change proposal was requested. Every result reports:

```text
persistenceEffect = NONE
authorityEffect = UNCHANGED
```

Statuses are `RESOLVED`, `AMBIGUOUS`, `UNRESOLVED`, and `CONFLICTING`.

## Compatibility and isolation

Part III compatibility is deliberately exact. Two references are compatible only when their type and stable identity match. Consequently:

```text
PROJECT:alpha != PROJECT:beta
USER:a != USER:b
CONVERSATION:1 != SESSION:1
```

Parent relationships do not automatically authorize inheritance. A later governed policy may add specific inheritance rules without weakening exact project, user, conversation, or tenant isolation.

Scope compatibility is a mandatory filter rather than a ranking bonus. Different project scopes may contain different database decisions without creating a conflict.

## Promotion and demotion

Scope changes are represented as immutable `PROPOSED` artifacts with provenance. Creating a proposal does not mutate either scope or durable knowledge. Promotion and demotion require later validation, approval, audit, and lifecycle components.

Repetition does not request or justify scope promotion. Scope never grants operational authority.

## Architecture boundary

`KnowledgeScopeResolver` is an asynchronous interface for future adapters. The Phase 0 implementation is `ConservativeKnowledgeScopeResolver`. It imports no persistence, memory, Prisma, repository, or authority module and performs no external side effect.
