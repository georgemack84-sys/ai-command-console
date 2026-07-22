# Phase 10.4.2 - Pattern Candidate Builder

## Preview

The Pattern Candidate Builder transforms certified historical records into candidate patterns that are eligible for later validation. It does not decide that a pattern is true, actionable, certified, or adaptive.

## Tightened Contract

This phase:

- consumes the Phase 10.4.1 Pattern Intelligence Contract;
- aggregates only certified historical records;
- applies deterministic historical windows and grouping keys;
- enforces minimum recurrence and evidence thresholds;
- creates immutable candidate identities and registry entries;
- preserves replay, evidence, governance, lineage, and tenant boundaries;
- fails closed on invalid contract input, insufficient history, missing evidence, missing replay, replay divergence, cross-tenant aggregation, governance violations, integrity mismatch, registry mutation, invalid lifecycle transition, or autonomous behavior.

## Non-Goals

- No pattern truth validation.
- No pattern certification.
- No automatic learning.
- No recommendation, confidence, priority, or governance change.
- No cross-tenant aggregation.

## Implemented Surface

- `GET /pattern-candidate-builder/contract`
- `POST /pattern-candidate-builder/build`
- `POST /pattern-candidate-builder/aggregate`
- `POST /pattern-candidate-builder/windows`
- `POST /pattern-candidate-builder/registry`
- `POST /pattern-candidate-builder/replay`
- `POST /pattern-candidate-builder/identity`
- `POST /pattern-candidate-builder/inspect`

## Exit Criteria

Phase 10.4.2 is complete when candidate generation is deterministic, replayable, evidence-backed, tenant-isolated, append-only, immutable, governance-aware, advisory-only, and ready for Phase 10.4.3 validation.
