import { describe, expect, it } from "vitest";
import {
  ARBITRATION_STATES,
  BLOCKER_TYPES,
  DECISION_CONFLICT_TYPES,
  DEPENDENCY_RELATIONSHIP_TYPES,
  computeConflictRecordHash,
  getConflictDependencyVisualizationFoundation,
  replayConflictDependencyVisualization,
  runConflictDependencyVisualization,
} from "@/services/decision-conflict-dependency-visualization";
import type { ConflictDependencyVisualizationFailure, ConflictDependencyVisualizationInput } from "@/types/decision-conflict-dependency-visualization";

describe("Mission Control Phase 9.11.4 Conflict & Dependency Visualization", () => {
  it("publishes the conflict and dependency visualization foundation", () => {
    const foundation = getConflictDependencyVisualizationFoundation();

    expect(foundation.visualization_version).toBe("decision-conflict-dependency-visualization/v1");
    expect(foundation.conflict_types).toEqual(DECISION_CONFLICT_TYPES);
    expect(foundation.relationship_types).toEqual(DEPENDENCY_RELATIONSHIP_TYPES);
    expect(foundation.arbitration_states).toEqual(ARBITRATION_STATES);
    expect(foundation.blocker_types).toEqual(BLOCKER_TYPES);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("builds a deterministic conflict map with evidence, governance, arbitration, and replay refs", () => {
    const result = runConflictDependencyVisualization();

    expect(result.conflicts).toHaveLength(3);
    expect(result.conflicts.every((conflict) => computeConflictRecordHash(conflict) === conflict.integrity_hash)).toBe(true);
    expect(result.conflict_map.conflict_clusters).toEqual(["governance_authority_cluster", "dependency_evidence_cluster"]);
    expect(result.conflict_map.severity_summary).toContain("CRITICAL");
    expect(result.conflict_map.arbitration_refs).toContain("arbitration_governance_authority");
    expect(result.conflict_map.replay_refs).toContain(result.timeline_result.replay_hash);
  });

  it("renders dependency graph nodes, edges, blockers, and deterministic rendering order", () => {
    const result = runConflictDependencyVisualization();

    expect(result.dependency_nodes).toHaveLength(7);
    expect(result.dependency_edges).toHaveLength(6);
    expect(result.dependency_graph.blocker_refs).toEqual(["edge_requires", "edge_blocks"]);
    expect(result.dependency_graph.rendering_order).toEqual(["edge_requires", "edge_blocks", "edge_conflicts_with", "edge_escalates_to", "edge_governed_by", "edge_certified_by"]);
    expect(result.dependency_graph.cycle_detected).toBe(false);
  });

  it("builds arbitration, blocker, and relationship explorer views", () => {
    const result = runConflictDependencyVisualization();

    expect(result.arbitration_view.selected_outcome).toContain("operator review");
    expect(result.arbitration_view.rejected_outcomes).toContain("auto-approve authority escalation");
    expect(result.blocker_views.map((blocker) => blocker.blocker_type)).toEqual(["GOVERNANCE_RESTRICTION", "MISSING_EVIDENCE"]);
    expect(result.relationship_explorer.visible_nodes).toEqual(result.dependency_nodes.map((node) => node.node_id));
    expect(result.relationship_explorer.visible_edges).toEqual(result.dependency_edges.map((edge) => edge.edge_id));
  });

  it("stores visualization evidence in an immutable conflict ledger", () => {
    const result = runConflictDependencyVisualization();

    expect(result.conflict_ledger).toHaveLength(10);
    expect(result.conflict_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
    expect(result.conflict_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("calculates conflict, dependency, blocker, governance, and replay metrics", () => {
    const result = runConflictDependencyVisualization();

    expect(result.metrics.conflict_count).toBe(3);
    expect(result.metrics.dependency_count).toBe(6);
    expect(result.metrics.blocker_count).toBe(2);
    expect(result.metrics.critical_conflicts).toBe(1);
    expect(result.metrics.arbitration_resolved).toBe(1);
    expect(result.metrics.replay_linked_items).toBeGreaterThan(0);
  });

  it("is replay-identical and advisory-only", () => {
    const first = runConflictDependencyVisualization();
    const second = runConflictDependencyVisualization();

    expect(second).toEqual(first);
    expect(replayConflictDependencyVisualization(first)).toBe(true);
    expect(first.deterministic).toBe(true);
    expect(first.advisory_only).toBe(true);
    expect(first.mutates_orchestration).toBe(false);
    expect(first.execution_authority_granted).toBe(false);
  });

  it("validates conflict visibility, dependencies, blockers, graph order, tenant isolation, and integrity", () => {
    const result = runConflictDependencyVisualization();

    expect(result.validation.conflicts_visible).toBe(true);
    expect(result.validation.dependencies_visible).toBe(true);
    expect(result.validation.blockers_visible).toBe(true);
    expect(result.validation.deterministic_rendering).toBe(true);
    expect(result.validation.governance_refs_present).toBe(true);
    expect(result.validation.replay_refs_present).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["HIDE_CONFLICTS", "CONFLICTS_HIDDEN"],
    ["HIDE_DEPENDENCIES", "DEPENDENCIES_HIDDEN"],
    ["HIDE_BLOCKERS", "BLOCKERS_HIDDEN"],
    ["MISSING_ARBITRATION", "ARBITRATION_OUTCOME_MISSING"],
    ["INCOMPLETE_EXPLORER", "RELATIONSHIP_EXPLORER_INCOMPLETE"],
    ["INCOMPLETE_LEDGER", "CONFLICT_LEDGER_INCOMPLETE"],
    ["NONDETERMINISTIC_GRAPH", "GRAPH_ORDER_NONDETERMINISTIC"],
    ["CYCLE_UNDETECTED", "CIRCULAR_DEPENDENCY_UNDETECTED"],
    ["MISSING_GOVERNANCE_REFS", "GOVERNANCE_REFS_MISSING"],
    ["MISSING_REPLAY_REFS", "REPLAY_REFS_MISSING"],
    ["CROSS_TENANT", "CROSS_TENANT_GRAPH_VISIBLE"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REPLAY_RECONSTRUCTION_FAILURE", "GRAPH_REPLAY_RECONSTRUCTION_FAILED"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<ConflictDependencyVisualizationInput["scenario"]>, ConflictDependencyVisualizationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runConflictDependencyVisualization({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_orchestration).toBe(false);
  });

  it("fails closed when the role lacks graph visibility", () => {
    const result = runConflictDependencyVisualization({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects replay tampering", () => {
    const result = runConflictDependencyVisualization();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayConflictDependencyVisualization(tampered)).toBe(false);
  });
});
