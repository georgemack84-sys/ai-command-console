# Phase 10.9.3 - Feedback Normalization Engine

The Feedback Normalization Engine transforms accepted operator feedback into canonical, deterministic, replayable evidence while preserving original wording, provenance, audit history, and operator intent.

## Tightened Prompt

Normalize structurally valid intake output into standardized evidence. Apply versioned normalization rules, deterministic classification, semantic mapping, duplicate resolution, confidence calibration, explainability, replay metadata, and append-only audit logging. The engine never generates adaptive proposals, learns from feedback, changes recommendations, overrides governance, executes simulations, or mutates production behavior.

## Implemented Scope

- Typed normalization contract in `types/feedback-normalization-engine.ts`.
- Deterministic service in `services/feedback-normalization-engine`.
- Canonical `NormalizedFeedbackRecord` with original feedback linkage, canonical feedback type, canonical issue, normalized summary, confidence level, semantic mapping version, normalization version, duplicate resolution, timestamp, replay reference, original wording, preserved evidence and replay refs, governance metadata hash, and integrity hash.
- Semantic mappings for evidence sufficiency, explanation deficiency, risk underestimation, confidence miscalibration, governance concern, simulation coverage gap, rollback improvement, approval, rejection, and override.
- Duplicate resolution for exact duplicate, semantic duplicate, and independent feedback.
- Explainability record and immutable audit events for every transformation step.
- Authenticated APIs under `/api/feedback-normalization-engine/*`.

## API Surface

- `GET /api/feedback-normalization-engine/contract`
- `GET /api/feedback-normalization-engine/vocabulary`
- `POST /api/feedback-normalization-engine/normalize`
- `POST /api/feedback-normalization-engine/record`
- `POST /api/feedback-normalization-engine/explanation`
- `POST /api/feedback-normalization-engine/audit`
- `POST /api/feedback-normalization-engine/replay`
- `POST /api/feedback-normalization-engine/inspect`

## Rejection Conditions

- Unsupported feedback classification
- Missing normalization rule
- Invalid semantic mapping version
- Corrupted feedback record
- Missing replay reference
- Undefined confidence mapping
- Duplicate resolution conflict
- Intake not accepted
- Tenant isolation failure
- Governance metadata invalid

## Certification Notes

- Original operator wording is never overwritten.
- Duplicate resolution never deletes submissions or audit history.
- Equivalent language maps to byte-identical canonical output under the same rule versions.
- Normalized feedback is evidence-only and ready for downstream adaptive analysis.
