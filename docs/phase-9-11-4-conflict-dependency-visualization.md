# Phase 9.11.4 - Conflict & Dependency Visualization

## Preview

Conflict & Dependency Visualization makes decision conflicts, dependencies, blockers, arbitration outcomes, and relationship structures visible to operators, governance authorities, and auditors. It is observational only and derives from the certified timeline, dashboard, replay, governance, and evidence chain.

## Tightened Contract

- Conflict maps must expose conflict types, severity, arbitration references, governance references, replay references, and immutable evidence.
- Dependency graphs must render nodes and edges deterministically with blocker refs, conflict refs, governance overlays, replay refs, and cycle detection.
- Arbitration views must show selected outcomes, rejected alternatives, tradeoffs, governance state, constitutional state, operator requirements, and replay refs.
- Blocker views must expose every blocker reason, blocked decision, blocking decision, required resolution, escalation path, governance refs, and replay refs.
- Relationship explorer views must expose decision-to-decision, evidence, governance, operator, replay, and certification relationships for authorized users.
- The conflict ledger is append-only and records conflict detection, classification, blockers, dependency resolution, arbitration, governance escalation, operator review, replay verification, and archival.
- Hidden conflicts, hidden dependencies, hidden blockers, missing arbitration, incomplete relationship explorer, incomplete ledger, nondeterministic graph order, undetected cycles, missing governance or replay refs, cross-tenant exposure, hash mismatch, replay reconstruction failure, authorization failure, and execution authority all fail closed.

## Implementation

- Types: `types/decision-conflict-dependency-visualization.ts`
- Service: `services/decision-conflict-dependency-visualization/index.ts`
- Tests: `tests/unit/decision-conflict-dependency-visualization/decisionConflictDependencyVisualization.test.ts`

The service provides deterministic conflict maps, dependency graph rendering, arbitration visualization, blocker visualization, relationship exploration, immutable conflict ledger entries, metrics, replay validation, and fail-closed enforcement for Phase 9.11 operational graph visibility.
