# Phase 7D.1 - Compliance Contract

## Purpose

Phase 7D.1 defines the canonical Compliance Intelligence contract. Compliance results are now represented as deterministic, explainable, replayable, tenant-safe, evidence-backed, and certification-ready records.

## Deliverables

- Compliance enums, identity model, evidence model, rule schema, threshold schema, replay package, confidence basis, corrective action model, lifecycle states, validation result, replay result, and operator visibility types in `types/compliance-contract.ts`.
- Compliance doctrine, category registry, rule registry, threshold registry, deterministic score mapping, confidence calculation, record builder, hash builder, validator, replay verifier, lifecycle transition guard, and observability surface in `services/compliance-contract/index.ts`.
- Authenticated API routes under `/api/compliance-contract/*`.
- Certification-readiness tests in `tests/unit/compliance-contract/complianceContract.test.ts`.

## Deterministic Contract

Every compliance record binds a known rule, known threshold, evaluation scope, authority source, evidence set, lineage reference, replay reference, confidence basis, Truth Ledger reference, and certification state.

The baseline score model maps `90-100` to `PASS`, `70-89` to `WARNING`, `1-69` to `FAIL`, and `0` or disqualifying conditions to `CRITICAL`. `UNKNOWN` and `INVALID` never satisfy compliance.

## Fail-Closed Rules

Validation fails closed for missing identity, tenant, rule, threshold, evidence, lineage, replay, Truth Ledger reference, invalid categories, invalid scopes, score/status mismatches, confidence mismatches, corrective actions without compliance references, cross-tenant references, immutable field mutation, hidden state, and hash mismatch.

## Replay

Each record includes a replay package with rule version, governing references, evidence snapshot, evaluation inputs, scoring inputs, confidence inputs, algorithm version, calculation hash, expected output, and Truth Ledger reference. Replay recomputes the compliance hash and returns `REPRODUCED`, `MISMATCH`, or `INCOMPLETE`.

## Lifecycle

The contract lifecycle allows only:

- `DRAFT -> ACTIVE`
- `ACTIVE -> SUPERSEDED`
- `ACTIVE -> RESTRICTED`
- `RESTRICTED -> ACTIVE`
- `RESTRICTED -> SUPERSEDED`
- `SUPERSEDED -> ARCHIVED`

Invalid transitions are blocked deterministically.

## Outcome

Mission Control can now represent compliance findings in a stable contract that supports Phase 7D.2 Compliance Evaluation Engine and later trend, confidence, and certification work.
