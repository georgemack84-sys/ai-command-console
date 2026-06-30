# Phase 8M.17 Generated Recovery Inventory

Status: discovered, pending final commit validation

Source: `node scripts/phase-8m-quality-gate.cjs --classify`

## Summary

Generated Recovery entries discovered: 58 classifier roots before staging expansion.

Risk: high.

Ownership recommendation: Recovery/replay owner with certification authority review for recovery intelligence certification and intervention-boundary behavior.

## File Inventory

Recovery API roots:

- `app/api/failure-analysis-engine/`
- `app/api/intervention-recommendation-engine/`
- `app/api/recovery-contract/`
- `app/api/recovery-intelligence-certification-gate/`
- `app/api/recovery-intervention-intelligence/`
- `app/api/recovery-planning-engine/`
- `app/api/recovery-recommendation-engine/`
- `app/api/recovery-replay-engine/`
- `app/api/recovery-validation-engine/`
- `app/api/rollback-preparation/`
- `app/api/supervision-intervention-boundary-lookup/`
- `app/api/supervision-intervention-replay/`

Recovery service roots:

- `services/failure-analysis-engine/`
- `services/intervention-recommendation-engine/`
- `services/recovery-contract/`
- `services/recovery-intelligence-certification-gate/`
- `services/recovery-intervention-intelligence/`
- `services/recovery-planning-engine/`
- `services/recovery-recommendation-engine/`
- `services/recovery-replay-engine/`
- `services/recovery-validation-engine/`
- `services/supervision-intervention-boundary-lookup/`
- `services/supervision-intervention-replay/`

Recovery test roots:

- `tests/unit/failure-analysis-engine/`
- `tests/unit/intervention-recommendation-engine/`
- `tests/unit/recovery-contract/`
- `tests/unit/recovery-intelligence-certification-gate/`
- `tests/unit/recovery-intervention-intelligence/`
- `tests/unit/recovery-planning-engine/`
- `tests/unit/recovery-recommendation-engine/`
- `tests/unit/recovery-replay-engine/`
- `tests/unit/recovery-validation-engine/`
- `tests/unit/rollback-preparation/`
- `tests/unit/supervision-intervention-boundary-lookup/`
- `tests/unit/supervision-intervention-replay/`

Recovery docs and types are listed in `docs/phase-8m-generated-recovery-manifest.md`.

## Dependencies

- Replay integrity.
- Runtime assurance.
- Recovery recommendation advisory boundaries.
- Intervention authorization boundaries.
- Rollback preparation.
- Certification evidence.
- Supervision intervention replay and boundary lookup.

## Validation Requirements

- Recovery targeted Vitest suites.
- TypeScript.
- Phase 8M classifier.
- Staged-diff guard with zero unexpected paths.

## Architectural Risk

High, because Recovery includes rollback preparation, failure analysis, intervention intelligence, replay, validation, and certification behavior. It is acceptable as an independent generated-domain commit only if no Runtime, Replay, Recommendation, or Certification domain files are mixed into the staged diff.

## Replay Dependencies

Recovery replay and supervision intervention replay must preserve deterministic reconstruction and evidence visibility. Any future behavioral review should verify replay inputs, replay outputs, certification evidence, and intervention boundary records remain immutable and operator-visible.
