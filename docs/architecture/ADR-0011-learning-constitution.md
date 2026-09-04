# ADR-0011: Learning Constitution

- Status: Accepted
- Date: 2026-08-20

## Context

Learning inputs can originate in conversations, models, tools, documents, or
agents. Treating those inputs as durable knowledge by default would allow
unverified content to silently alter system behavior or authority.

## Decision

The Learning Constitution is the highest semantic authority for the learning
subsystem. It requires classification, explicit scope, conflict detection,
independent validation, and an explicit learning decision before durable
admission. Unknown, failed, incomplete, or uncertain controls fail closed.

Learning is separate from operational authority: durable knowledge, competence,
and execution permission remain distinct states. Constitutional changes are not
ordinary learned knowledge and require a separate authorized amendment process.

## Consequences

- Conversation, model output, and repeated statements do not automatically
  become durable knowledge.
- Durable records retain immutable provenance and historical relationships.
- Lower governance layers, including learned procedures and preferences, cannot
  override the constitution.
- Implementations must expose auditable admission decisions without granting
  execution permission as a side effect.
