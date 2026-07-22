# Mission Control Phase 9.1.2 - Decision Schema Definitions

## Purpose

Phase 9.1.2 turns the Phase 9.1.1 Decision Contract foundation into enforceable, type-safe schema structures for decision inputs, outputs, metadata, references, and orchestration records. These schemas validate decision payloads before they enter orchestration. They do not evaluate, rank, approve, execute, or mutate decisions.

## Canonical Implementation

- `types/decision-schema.ts`
- `services/decision-schema/index.ts`
- `schemas/decision/decision.input.schema.json`
- `schemas/decision/decision.output.schema.json`
- `schemas/decision/decision.metadata.schema.json`
- `schemas/decision/decision.reference.schema.json`
- `schemas/decision/decision.enums.schema.json`
- `schemas/decision/decision.orchestration.record.schema.json`
- `tests/unit/decision-schema/decisionSchema.test.ts`

## Schemas

The implementation defines:

- `DecisionInput`
- `DecisionOutput`
- `DecisionMetadata`
- `DecisionReference`
- `DecisionOrchestrationRecord`
- `DecisionType`
- `DecisionPriority`
- `DecisionState`
- `ValidationStatus`

Every schema validates required fields, enum values, reference shape, tenant scope, mission scope, normalized timestamps, deterministic reference ordering, and SHA-256 integrity hashes.

## APIs

- `validateDecisionInputSchema()`
- `validateDecisionOutputSchema()`
- `validateDecisionMetadataSchema()`
- `validateDecisionReferenceSchema()`
- `validateDecisionOrchestrationRecordSchema()`
- `assertDecisionInputType()`
- `assertDecisionOutputType()`
- `assertDecisionReferenceType()`
- `assertDecisionMetadataType()`
- `serializeDecisionSchemaDeterministically()`
- `hashDecisionSchemaPayload()`

## Guarantees

The schema layer fails closed when required fields are missing, enum values are unsupported, references are malformed or unordered, governance references are missing, constitutional references are missing, replay references are missing, lineage references are missing, tenant or mission scope is violated, advisory-only output is broken, timestamps are not normalized, or integrity hashes cannot be reproduced.

Identical schema payloads serialize identically and produce identical SHA-256 hashes.

## Exit Criteria

Phase 9.1.2 is complete when input, output, metadata, reference, enum, and orchestration record schemas are defined as TypeScript types and JSON schema artifacts; runtime validators enforce required fields and fail-closed boundaries; deterministic serialization and integrity hashing are reproducible; and unit tests cover valid payloads plus boundary failures.
