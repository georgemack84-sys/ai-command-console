# Phase 8ALT.1F - Assurance State Manager

## Purpose

Phase 8ALT.1F implements the deterministic Assurance State Manager. It evaluates runtime assurance conditions, validates state transitions, applies certified thresholds, records immutable lifecycle history, validates replay, and publishes assurance state without controlling execution.

## Implemented Surfaces

- `types/assurance-state-manager.ts` defines assurance states, lifecycle stages, certified thresholds, transition validation, state records, history records, replay, validation, certification, and publisher surfaces.
- `services/assurance-state-manager/index.ts` evaluates assurance state from Phase 8ALT.1E recommendations, enforces the transition matrix, applies threshold snapshots, detects escalation and recovery, records append-only history, validates replay, and certifies state records.
- `app/api/assurance-state-manager/*` exposes contract, evaluation, validation, thresholds, history, replay, and certification endpoints.
- `tests/unit/assurance-state-manager/assuranceStateManager.test.ts` verifies state doctrine, transition matrix behavior, baseline/escalation/recovery transitions, failure handling, replay determinism, thresholds, and advisory-only execution boundaries.

## State Model

`ASSURED -> STABLE -> WATCH -> DEGRADED -> CRITICAL`

Allowed transitions follow the certified matrix:

- `ASSURED` to `STABLE`
- `STABLE` to `ASSURED` or `WATCH`
- `WATCH` to `STABLE` or `DEGRADED`
- `DEGRADED` to `WATCH` or `CRITICAL`
- `CRITICAL` to `DEGRADED`

## Guarantees

- Every state transition is deterministic, threshold-backed, governance-validated, constitutionally checked, integrity verified, and replayable.
- Lifecycle history is append-only and includes triggering events, threshold snapshots, governance/constitutional/integrity snapshots, replay references, and lineage references.
- Invalid transitions, skipped lifecycle stages, oscillation, repeated degradation, failed recovery, inconsistent thresholds, governance failures, constitutional failures, integrity failures, replay mismatches, and unauthorized execution capability fail closed.
- The manager controls assurance state only; it never authorizes, modifies, or directly controls autonomous execution.
