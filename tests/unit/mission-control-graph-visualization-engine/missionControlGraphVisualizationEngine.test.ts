import { describe, expect, it } from "vitest";
import {
  buildMissionControlGraphVisualizationObservabilitySurface,
  computeMissionControlGraphVisualizationHash,
  getMissionControlGraphVisualizationContract,
  runMissionControlGraphVisualizationEngine,
  validateMissionControlGraphVisualizationEngine,
} from "@/services/mission-control-graph-visualization-engine";
import type { GraphVisualizationFailure, MissionControlGraphScenario } from "@/types/mission-control-graph-visualization-engine";

describe("Mission Control Phase 8J.3 Graph Visualization Engine", () => {
  it("defines graph visualization doctrine and controlled graph modes", () => {
    const contract = getMissionControlGraphVisualizationContract();

    expect(contract.doctrine.schema_version).toBe("mission-control-graph-visualization-engine/v8J.3");
    expect(contract.doctrine.principles).toContain("deterministic-rendering");
    expect(contract.doctrine.principles).toContain("governance-transparency");
    expect(contract.doctrine.graph_types).toEqual(["PLANNING_GRAPH", "DELEGATION_GRAPH", "EXECUTION_GRAPH", "LINEAGE_GRAPH", "GOVERNANCE_GRAPH"]);
    expect(contract.doctrine.graph_states).toContain("REPLAYING");
    expect(contract.doctrine.layout_types).toEqual(["HIERARCHICAL", "DAG", "TIMELINE", "FORCE_DIRECTED", "TREE"]);
    expect(contract.doctrine.replay_modes).toEqual(["LIVE", "SNAPSHOT", "HISTORICAL", "STEP_BY_STEP", "FORENSIC"]);
    expect(contract.doctrine.no_execution_authority).toBe(true);
  });

  it("builds a valid deterministic graph visualization report", () => {
    const report = runMissionControlGraphVisualizationEngine();
    const validation = validateMissionControlGraphVisualizationEngine(report);

    expect(report.phase_version).toBe("8J.3");
    expect(report.validation_outcome).toBe("VALID");
    expect(report.graphs.length).toBe(5);
    expect(report.graphs.every((graph) => graph.graph_state === "READY")).toBe(true);
    expect(report.validation_tests.length).toBe(41);
    expect(report.validation_tests.every((test) => test.passed)).toBe(true);
    expect(report.layout_record.layout_type).toBe("DAG");
    expect(report.replay_record.replay_mode).toBe("LIVE");
    expect(report.advisory_only).toBe(true);
    expect(report.execution_authority_granted).toBe(false);
    expect(validation.valid).toBe(true);
  });

  it("renders planning, delegation, execution, lineage, and governance graph contents", () => {
    const report = runMissionControlGraphVisualizationEngine();
    const planning = report.graphs.find((graph) => graph.graph_type === "PLANNING_GRAPH");
    const delegation = report.graphs.find((graph) => graph.graph_type === "DELEGATION_GRAPH");
    const execution = report.graphs.find((graph) => graph.graph_type === "EXECUTION_GRAPH");
    const lineage = report.graphs.find((graph) => graph.graph_type === "LINEAGE_GRAPH");
    const governance = report.graphs.find((graph) => graph.graph_type === "GOVERNANCE_GRAPH");

    expect(planning?.nodes.map((node) => node.node_type)).toEqual(["MISSION", "OBJECTIVE", "PLAN", "SUBPLAN", "TASK", "DEPENDENCY", "ALTERNATIVE", "BRANCH", "CONTINGENCY", "CHECKPOINT"]);
    expect(planning?.edges.map((edge) => edge.edge_type)).toContain("BRANCHES_TO");
    expect(delegation?.nodes.map((node) => node.node_type)).toContain("EXTERNAL_SYSTEM");
    expect(delegation?.edges.map((edge) => edge.edge_type)).toContain("OWNED_BY");
    expect(execution?.nodes.map((node) => node.node_type)).toContain("ROLLBACK");
    expect(execution?.edges.map((edge) => edge.edge_type)).toContain("RECOVERS_FROM");
    expect(lineage?.nodes.map((node) => node.node_type)).toContain("REPLAY");
    expect(lineage?.edges.map((edge) => edge.edge_type)).toContain("INTERVENED_IN");
    expect(governance?.nodes.map((node) => node.node_type)).toContain("SUPERVISION");
    expect(governance?.edges.map((edge) => edge.edge_type)).toContain("INFLUENCED");
  });

  it("preserves node and edge evidence, replay, lineage, integrity, and deterministic layout data", () => {
    const report = runMissionControlGraphVisualizationEngine({ layout_type: "HIERARCHICAL", replay_mode: "FORENSIC" });
    const nodes = report.graphs.flatMap((graph) => graph.nodes);
    const edges = report.graphs.flatMap((graph) => graph.edges);

    expect(report.layout_record.layout_type).toBe("HIERARCHICAL");
    expect(report.layout_record.node_positions_preserved).toBe(true);
    expect(report.layout_record.edge_order_preserved).toBe(true);
    expect(report.layout_record.evidence_overlay_enabled).toBe(true);
    expect(report.layout_record.integrity_overlay_enabled).toBe(true);
    expect(report.replay_record.replay_mode).toBe("FORENSIC");
    expect(report.replay_record.historical_reconstruction_enabled).toBe(true);
    expect(nodes.every((node) => node.immutable_id && node.timestamp && node.replay_reference && node.lineage_reference && node.integrity_hash)).toBe(true);
    expect(nodes.every((node) => node.evidence_references.length > 0 && node.governance_references.length > 0)).toBe(true);
    expect(edges.every((edge) => edge.edge_type && edge.relationship_origin && edge.timestamp && edge.replay_reference && edge.integrity_hash)).toBe(true);
    expect(edges.every((edge) => edge.evidence_references.length > 0)).toBe(true);
  });

  it("repeats identical graph reports with identical hashes and layout positions", () => {
    const first = runMissionControlGraphVisualizationEngine({ layout_type: "TIMELINE", replay_mode: "HISTORICAL" });
    const second = runMissionControlGraphVisualizationEngine({ layout_type: "TIMELINE", replay_mode: "HISTORICAL" });

    expect(second.engine_hash).toBe(first.engine_hash);
    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.graphs.map((graph) => graph.graph_hash)).toEqual(first.graphs.map((graph) => graph.graph_hash));
    expect(second.graphs.flatMap((graph) => graph.nodes.map((node) => node.position))).toEqual(first.graphs.flatMap((graph) => graph.nodes.map((node) => node.position)));
    expect(first.engine_hash).toBe(computeMissionControlGraphVisualizationHash(first));
  });

  it.each([
    ["NONDETERMINISTIC_STRUCTURE", "GRAPH_STRUCTURE_NONDETERMINISTIC"],
    ["INCONSISTENT_RELATIONSHIP", "NODE_RELATIONSHIP_INCONSISTENT"],
    ["MISSING_DEPENDENCY", "DEPENDENCY_MISSING"],
    ["REPLAY_DIVERGENCE", "REPLAY_RECONSTRUCTION_DIVERGED"],
    ["LINEAGE_GAP", "LINEAGE_GAP_DETECTED"],
    ["MISSING_GOVERNANCE_INFLUENCE", "GOVERNANCE_INFLUENCE_NOT_TRACEABLE"],
    ["HIDDEN_RELATIONSHIP", "HIDDEN_AUTONOMOUS_RELATIONSHIP_VISIBLE"],
    ["CROSS_TENANT_NODE", "CROSS_TENANT_NODE_VISIBLE"],
    ["MISSING_INTEGRITY_HASH", "INTEGRITY_HASH_MISSING"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["MISSING_EVIDENCE_REFERENCE", "EVIDENCE_REFERENCE_MISSING"],
    ["EXECUTION_AUTHORITY_EXPOSED", "GRAPH_EXECUTION_AUTHORITY_EXPOSED"],
    ["UNAUTHORIZED_GRAPH_ACCESS", "UNAUTHORIZED_GRAPH_ACCESS"],
  ] as readonly [MissionControlGraphScenario, GraphVisualizationFailure][])(
    "invalidates %s with %s",
    (scenario, failure) => {
      const report = runMissionControlGraphVisualizationEngine({ scenario });
      const validation = validateMissionControlGraphVisualizationEngine(report);

      expect(report.validation_outcome).not.toBe("VALID");
      expect(report.failures).toContain(failure);
      expect(report.validation_tests.map((test) => test.failure_reason)).toContain(failure);
      expect(validation.valid).toBe(false);
    },
  );

  it("exposes graph observability for operator inspection", () => {
    const surface = buildMissionControlGraphVisualizationObservabilitySurface(runMissionControlGraphVisualizationEngine({ scenario: "REPLAY_DIVERGENCE", replay_mode: "STEP_BY_STEP" }));

    expect(surface.validation_outcome).toBe("INVALID");
    expect(surface.failures).toContain("REPLAY_RECONSTRUCTION_DIVERGED");
    expect(surface.graph_count).toBe(5);
    expect(surface.node_count).toBeGreaterThan(30);
    expect(surface.edge_count).toBeGreaterThan(30);
    expect(surface.replay_mode).toBe("STEP_BY_STEP");
    expect(surface.failed_tests).toBeGreaterThan(0);
    expect(surface.execution_authority_granted).toBe(false);
  });
});
