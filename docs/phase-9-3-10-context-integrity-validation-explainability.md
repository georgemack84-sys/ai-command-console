# Mission Control Phase 9.3.10 - Context Integrity, Validation & Explainability

Phase 9.3.10 adds the final assurance layer for assembled decision contexts before release
to orchestration.

## Scope

The framework:

- validates the assembled decision context against the canonical 9.3.1 contract;
- recomputes context, domain, resolver, lineage, replay, and validation hashes;
- verifies resolver consistency through the 9.3.9 completeness package;
- verifies source attribution across every mandatory context domain;
- generates deterministic explanations from structured context metadata only;
- validates replayability of the validation package;
- fails closed for integrity mismatch, schema failure, resolver inconsistency, incomplete
  attribution, incomplete explainability, replay failure, tenant contamination, and advisory
  violation.

## Public API

`createContextIntegrityValidationRequest(overrides?)`

Creates a validation request with candidate, decision context, completeness package, and
framework version.

`validateContextIntegrityExplainability(request?)`

Returns a `ContextIntegrityValidationReport` containing:

- `context_validation`
- `context_integrity`
- `context_explanation`
- `validation_evidence`
- failure reasons and checks
- replay reference
- integrity hash

`replayContextIntegrityValidation(report)`

Recomputes the report hash and reports whether validation evidence can be replayed exactly.

`buildContextIntegrityValidationObservability(reports)`

Aggregates validation attempts, certification count, failure classes, and replay success rate.

`getContextIntegrityValidationExplainabilityFramework()`

Returns framework version, domain order, default request, default report, replay result, and
observability snapshot.

## Explainability

Explanations are derived from structured domain metadata:

- resolver
- source subsystem
- originating record
- supporting evidence
- governance rationale
- constitutional rationale
- replay reference

No generated or inferred rationale is introduced.

## Certification

A context is `CERTIFIED` only when schema, integrity, resolver consistency, attribution,
explainability, replay, governance, constitutional, tenant isolation, and advisory-only checks
all pass. Integrity mismatch and cross-tenant contamination produce `FAIL_CLOSED`.
