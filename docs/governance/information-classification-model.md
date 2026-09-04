# Information Classification Model

- Phase: Phase 0, Part II
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)

## Purpose

Classification describes what an observation appears to mean before scope resolution, conflict detection, validation, approval, or persistence. It is not a learning or authority decision.

```text
Statement
  -> Classification
  -> Scope Determination
  -> Conflict Detection
  -> Validation
  -> Persistence Decision
```

The classifier has no persistence dependency and cannot write durable knowledge. Every result explicitly reports `persistenceEffect = NONE`, `authorityEffect = UNCHANGED`, and `executionPermissionGranted = false`.

## Canonical taxonomy

The strongly typed taxonomy remains the GP-01 vocabulary:

`CONVERSATION`, `BRAINSTORMING`, `SUGGESTION`, `FACT`, `PREFERENCE`, `INSTRUCTION`, `PROJECT_DECISION`, `PRINCIPLE`, `PROCEDURE`, `CORRECTION`, `EXCEPTION`, and `AUTHORITATIVE_RULE`.

`CLASSIFICATION_SEMANTICS` defines the concise meaning, default status, proposed durability, and validation requirement for every type. Detailed future policy may strengthen these requirements but cannot collapse the following boundaries:

```text
CONVERSATION != LEARNING
BRAINSTORMING != DECISION
SUGGESTION != INSTRUCTION
PREFERENCE != RULE
PROCEDURE != PERMISSION
LEARNING != AUTHORITY
```

## Classification result

The result contains:

- an optional canonical classification;
- calibrated confidence in the range 0–1;
- `CLASSIFIED`, `PROPOSED`, or `AMBIGUOUS` status;
- proposed durability;
- an optional scope hint that does not resolve scope;
- whether downstream validation is required;
- immutable observation provenance;
- safe rationale code, matched signal labels, classifier identity, and version;
- correction and exception relationship hints;
- explicit no-persistence and no-authority effects.

Reasoning metadata is concise evidence about the classification decision. It does not contain hidden chain-of-thought.

## Conservative ambiguity

The Phase 0 implementation recognizes only explicit, bounded language signals. Empty, weak, or unrecognized wording returns:

```text
status = AMBIGUOUS
classification = undefined
proposedDurability = NONE
requiresValidation = true
```

Downstream code may request clarification. It must not replace an ambiguous outcome with a guessed durable category.

## Relationship hints

Corrections may carry `supersedesKnowledgeIds`; exceptions may carry `exceptionToKnowledgeIds`. Classification preserves these references but does not apply lifecycle transitions. Conflict and lifecycle components remain responsible for verifying and acting on them.

## Extension boundary

`InformationClassifier` is asynchronous so later model-backed adapters can implement it. Model output must still conform to the same typed result and conservative guardrails. The deterministic Phase 0 implementation is `ConservativeInformationClassifier`.

No classifier implementation may import a knowledge repository, memory store, Prisma client, filesystem writer, or execution-authority mutation service. Classification-side effects remain prohibited.
