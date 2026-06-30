# Phase 8J.3 - Graph Visualization Engine

## Purpose

Phase 8J.3 provides deterministic, read-only Mission Control graph visualization for autonomous reasoning, delegation, execution, lineage, and governance influence. It lets operators inspect how decisions, plans, execution paths, and interventions relate without granting execution authority.

## Implementation

- `types/mission-control-graph-visualization-engine.ts` defines graph, node, edge, layout, replay, validation, failure, report, and observability contracts.
- `services/mission-control-graph-visualization-engine/index.ts` builds deterministic planning, delegation, execution, lineage, and governance graphs and validates replay, lineage, integrity, evidence, tenant isolation, and advisory-only guarantees.
- `app/api/mission-control-graph-visualization-engine/*` exposes contract, engine, graph collection, individual graph viewers, layout, replay, and inspect endpoints.
- `tests/unit/mission-control-graph-visualization-engine/missionControlGraphVisualizationEngine.test.ts` verifies certification-readiness requirements and failure conditions.

## Graph Views

The engine renders five graph types: `PLANNING_GRAPH`, `DELEGATION_GRAPH`, `EXECUTION_GRAPH`, `LINEAGE_GRAPH`, and `GOVERNANCE_GRAPH`. Each graph has deterministic node positions, stable render ordering, evidence overlays, integrity overlays, replay references, lineage references, and governance references.

## Replay And Layout

Supported layouts are `HIERARCHICAL`, `DAG`, `TIMELINE`, `FORCE_DIRECTED`, and `TREE`. Supported replay modes are `LIVE`, `SNAPSHOT`, `HISTORICAL`, `STEP_BY_STEP`, and `FORENSIC`. Replay and layout records are deterministic and hash-protected.

## Read-Only Guarantees

The graph engine never modifies execution state, initiates execution, alters governance decisions, mutates replay history, hides autonomous relationships, exposes unauthorized tenant data, or grants execution authority.
