# Phase 10.6.1 - Confidence Calibration Engine

## Preview

The Confidence Calibration Engine measures how accurately historical confidence predictions matched observed operational outcomes. It calculates calibration accuracy, bias, variance, precision, consistency, and uncertainty alignment without modifying confidence scores or models.

## Tightened Contract

- Calibration is advisory-only and never updates confidence models.
- Historical inputs are immutable and identical inputs produce identical results.
- Outcome data, evidence, governance references, and replay references are required for certification.
- Missing outcome data, missing replay, cross-tenant contamination, integrity mismatch, confidence mutation, and fail-open behavior fail closed.
- Missing evidence reduces confidence, flags the report, and prevents certification.
- Calibration registry records are immutable, append-only, replayable, and tenant-isolated.

## Implemented Surface

- `GET /confidence-calibration-engine/contract`
- `POST /confidence-calibration-engine/analyze`
- `POST /confidence-calibration-engine/results`
- `POST /confidence-calibration-engine/scores`
- `POST /confidence-calibration-engine/report`
- `POST /confidence-calibration-engine/evidence`
- `POST /confidence-calibration-engine/bias`
- `POST /confidence-calibration-engine/variance`
- `POST /confidence-calibration-engine/precision`
- `POST /confidence-calibration-engine/consistency`
- `POST /confidence-calibration-engine/replay`
- `POST /confidence-calibration-engine/registry`
- `POST /confidence-calibration-engine/inspect`

## Exit Criteria Mapping

- Predicted confidence is deterministically compared with actual outcomes.
- Accuracy, bias, variance, precision, consistency, uncertainty alignment, and forecast reliability are reproducible.
- Reports include governance visibility, operator transparency, evidence review, replay refs, and recommended follow-up.
- No confidence value is modified.
