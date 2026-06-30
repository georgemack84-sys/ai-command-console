# Phase 8B.1 - Objective Decomposition Engine

## Purpose

The Objective Decomposition Engine transforms high-level, governance-approved objectives into deterministic, explainable task hierarchies. It does not optimize or execute plans; it only creates reproducible sub-objectives, milestones, atomic tasks, lineage, replay metadata, and validation outputs for downstream dependency analysis.

## Implemented Artifacts

- `types/objective-decomposition.ts` defines mission objectives, interpretations, sub-objectives, milestones, atomic tasks, hierarchy packages, validation, replay, visibility, scenarios, and failure reasons.
- `services/objective-decomposition/index.ts` implements objective validation, interpretation, hierarchy building, sub-objective generation, milestone generation, atomic task generation, hierarchy validation, governance validation, replay, and visibility.
- `app/api/objective-decomposition/*` exposes authenticated framework, objective, interpret, decompose, validate, replay, and visibility endpoints.
- `tests/unit/objective-decomposition/objectiveDecomposition.test.ts` covers baseline decomposition, rejection scenarios, replay determinism, ordering mismatch detection, and visibility.

## Engine Guarantees

The engine produces deterministic sub-objectives, six replayable milestone checkpoints, and atomic tasks with parent objective, required authority, governance references, completion criteria, replay references, lineage references, and explanations.

## Validation Coverage

Validation rejects missing approvals, duplicate objectives, invalid authority, governance violations, constitutional violations, ambiguous objectives, cyclic hierarchy, duplicate tasks, orphan tasks, missing milestones, nondeterministic ordering, tenant isolation violations, hidden tasks, incomplete lineage, missing replay metadata, and integrity mismatches.

## Downstream Readiness

A hierarchy is ready for Phase 8B.2 Dependency Analysis only when schema, approval, authority, governance, constitution, tenant isolation, hierarchy integrity, deterministic ordering, replay metadata, lineage, and integrity validation all pass.
