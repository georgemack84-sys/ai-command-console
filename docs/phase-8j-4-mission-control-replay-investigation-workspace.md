# Phase 8J.4 - Replay Investigation Workspace

## Purpose

Phase 8J.4 provides a deterministic, governance-aware Mission Control workspace for investigating autonomous history. Operators can reconstruct replay sessions, inspect timelines, verify integrity, trace lineage, compare historical records, search prior activity, inspect evidence, and export audit reports without modifying history.

## Implementation

- `types/mission-control-replay-investigation-workspace.ts` defines replay, integrity, lineage, timeline, investigation console, comparison, search, evidence, audit export, validation, report, and observability contracts.
- `services/mission-control-replay-investigation-workspace/index.ts` builds deterministic investigation records and validates replay fidelity, integrity verification, lineage completeness, timeline ordering, evidence completeness, search ordering, tenant isolation, and advisory-only behavior.
- `app/api/mission-control-replay-investigation-workspace/*` exposes contract, workspace, replay, integrity, lineage, timeline, console, comparisons, search, evidence, audit, and inspect endpoints.
- `tests/unit/mission-control-replay-investigation-workspace/replayInvestigationWorkspace.test.ts` verifies certification-readiness requirements and failure conditions.

## Workspace Views

The workspace includes replay sessions, an integrity viewer, lineage viewer, timeline explorer, investigation console, historical comparisons, deterministic searches, evidence inspection, and immutable audit exports.

## Replay And Investigation Modes

Replay modes are `LIVE`, `HISTORICAL`, `STEP_BY_STEP`, `CHECKPOINT`, `FORENSIC`, and `COMPARISON`. Investigation modes include replay analysis, failure analysis, forensic investigation, governance review, policy analysis, lineage analysis, and comparative analysis.

## Immutable Guarantees

The workspace never executes missions, alters replay history, modifies evidence, rewrites lineage, updates integrity hashes, bypasses governance, exposes hidden history, displays unauthorized tenant data, or grants execution authority.
