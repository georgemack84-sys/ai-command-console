# Phase 8C.7 - Rollback Preparation Engine

## Purpose

The Rollback Preparation Engine creates deterministic, governance-safe rollback plans from certified checkpoints. It analyzes checkpoint history, workflow progression, dependencies, governance state, authority boundaries, reversibility, confidence, and replay lineage to publish advisory rollback options for operator review.

The engine never executes rollback, restarts execution, modifies workflows, bypasses governance, changes policy, or escalates authority.

## Implementation

- `types/rollback-preparation.ts` defines rollback lifecycle state, confidence levels, rollback boundaries, checkpoint selection, reversibility status, dependency analysis, rollback graph, sequence steps, governance validation, confidence reports, recovery recommendations, lineage, replay, and visibility.
- `services/rollback-preparation/index.ts` builds rollback preparation packages from `CheckpointManagerPackage`, selects eligible recovery checkpoints, ranks alternatives, generates deterministic rollback graphs and sequences, estimates confidence, publishes recommendations, and validates advisory-only constraints.
- `app/api/rollback-preparation/*` exposes framework, prepare, boundary, validate, replay, and visibility endpoints behind workspace authentication.
- `tests/unit/rollback-preparation/rollbackPreparation.test.ts` covers baseline plans, checkpoint selection, graph and sequence determinism, reversibility failures, governance and authority blocks, replay divergence, lineage failures, tampering, advisory-only enforcement, and conditional low confidence.

## Validation Rules

Rollback preparation certification requires:

- valid upstream checkpoint manager certification
- at least one eligible certified checkpoint
- safe rollback boundary selection
- reversible tasks, dependencies, resources, workflow, governance, and authority
- governance and authority validation before publication
- deterministic rollback graph and ordered sequence
- replay references and lineage continuity
- advisory-only recommendations with no rollback execution

Low confidence is represented as `CONDITIONAL_PASS`; all hard safety, governance, replay, lineage, tenant, and integrity failures produce `FAIL`.

## API Surface

- `GET /api/rollback-preparation/framework`
- `POST /api/rollback-preparation/prepare`
- `POST /api/rollback-preparation/boundary`
- `POST /api/rollback-preparation/validate`
- `POST /api/rollback-preparation/replay`
- `POST /api/rollback-preparation/visibility`

Request bodies may include a deterministic `scenario` value for validation and test coverage.

## Exit State

Phase 8C.7 is ready when rollback plans are deterministic, explainable, replayable, governance-gated, authority-preserving, confidence-scored, lineage-protected, integrity-verified, and explicitly unable to perform autonomous recovery.
