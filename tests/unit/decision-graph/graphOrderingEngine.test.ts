import { describe, expect, it } from "vitest";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import {
  computeDecisionGraphNodeIntegrityHash,
  orderDecisionGraph,
  validateGraphSafety,
  type CanonicalDecisionRelationshipType,
  type DecisionGraphRoadmapNodeInput,
  type DecisionRelationshipRecord,
} from "@/services/decision-graph";

function node(nodeId: string, overrides: Partial<DecisionGraphRoadmapNodeInput> = {}): DecisionGraphRoadmapNodeInput {
  const base = {
    node_id: nodeId,
    decision_candidate_id: `candidate-${nodeId}`,
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    decision_type: "RECOMMENDATION",
    priority: 0,
    state: "DEPENDENCY_VALIDATED",
    previous_state: "RELATIONSHIPS_RESOLVED",
    dependency_refs: [],
    conflict_refs: [],
    blocker_refs: [],
    supporting_refs: [],
    weakening_refs: [],
    supersession_refs: [],
    escalation_refs: [],
    governance_refs: [`governance-${nodeId}`],
    authority_refs: [],
    simulation_refs: [],
    recovery_refs: [],
    certification_refs: [],
    replay_refs: [`replay-${nodeId}`],
    source_candidate_hash: `candidate-hash-${nodeId}`,
    created_at: `source-${nodeId}`,
    updated_at: `source-${nodeId}`,
    ...overrides,
  } satisfies DecisionGraphRoadmapNodeInput;

  return Object.freeze({ ...base, integrity_hash: computeDecisionGraphNodeIntegrityHash(base) } satisfies DecisionGraphRoadmapNodeInput);
}

function relationship(
  sourceNodeId: string,
  targetNodeId: string,
  relationshipType: CanonicalDecisionRelationshipType = "depends_on",
  overrides: Partial<DecisionRelationshipRecord> = {},
): DecisionRelationshipRecord {
  const base = {
    relationship_id: `relationship-${sourceNodeId}-${targetNodeId}-${relationshipType}`,
    graph_id: "graph-alpha",
    source_node_id: sourceNodeId,
    target_node_id: targetNodeId,
    target_type: "DECISION_NODE",
    relationship_type: relationshipType,
    direction: "SOURCE_TO_TARGET",
    relationship_basis: [`basis-${sourceNodeId}-${targetNodeId}`],
    confidence_basis: [`confidence-${sourceNodeId}`],
    governance_refs: [`governance-${sourceNodeId}-${targetNodeId}`],
    replay_refs: [`replay-${sourceNodeId}-${targetNodeId}`],
    source_candidate_refs: [`candidate-${sourceNodeId}`],
    target_candidate_refs: [`candidate-${targetNodeId}`],
    resolver_version: "decision-relationship-resolver/v1",
    ...overrides,
  } satisfies Omit<DecisionRelationshipRecord, "integrity_hash">;
  return Object.freeze({ ...base, integrity_hash: overrides.integrity_hash ?? generateDecisionIntegrityHash(base) } satisfies DecisionRelationshipRecord);
}

function safeGraph(nodes: readonly DecisionGraphRoadmapNodeInput[], relationships: readonly DecisionRelationshipRecord[]) {
  const safety = validateGraphSafety({
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    graph_version: "decision-graph/v1",
    nodes,
    relationships,
  });
  expect(safety.safety_status).toBe("SAFE");
  return safety;
}

function order(nodes: readonly DecisionGraphRoadmapNodeInput[], relationships: readonly DecisionRelationshipRecord[], overrides: Partial<Parameters<typeof orderDecisionGraph>[0]> = {}) {
  return orderDecisionGraph({
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    graph_version: "decision-graph/v1",
    nodes,
    relationships,
    graph_safety: overrides.graph_safety ?? safeGraph(nodes, relationships),
    ...overrides,
  });
}

describe("graphOrderingEngine", () => {
  it("preserves dependency order and produces deterministic replayable evidence", () => {
    const nodes = [node("node-a"), node("node-b"), node("node-c")];
    const relationships = [
      relationship("node-b", "node-a"),
      relationship("node-c", "node-b"),
      relationship("node-a", "node-b", "supports"),
      relationship("node-b", "node-c", "supports"),
    ];
    const first = order(nodes, relationships);
    const second = order(nodes, relationships);

    expect(first).toEqual(second);
    expect(first.ordering_status).toBe("PASS");
    expect(first.ordered_node_ids).toEqual(["node-a", "node-b", "node-c"]);
    expect(first.ordering_record?.ordering_algorithm).toBe("deterministic_topological_sort");
    expect(first.explanations).toHaveLength(3);
    expect(first.ledger_records).toHaveLength(3);
    expect(first.updated_nodes.every((item) => item.state === "ORDERED")).toBe(true);
    expect(first.reasonCodes).toContain("DEPENDENCY_ORDER_PRESERVED");
    expect(first.reasonCodes).toContain("REPLAY_RECONSTRUCTS_IDENTICAL_ORDERING");
  });

  it("applies deterministic tie-breakers across simultaneously eligible nodes", () => {
    const nodes = [
      node("node-c", { priority: 1, created_at: "source-3" }),
      node("node-a", { priority: 0, created_at: "source-1" }),
      node("node-b", { priority: 0, created_at: "source-2" }),
    ];
    const result = order(nodes, [relationship("node-b", "node-a"), relationship("node-a", "node-b", "supports"), relationship("node-a", "node-c", "supports")]);

    expect(result.ordering_status).toBe("PASS");
    expect(result.ordered_node_ids).toEqual(["node-a", "node-b", "node-c"]);
    expect(result.reasonCodes).toContain("TIE_BREAK_RESOLUTION_DETERMINISTIC");
  });

  it("excludes blocked, conflicted, superseded, archived, certification-pending, replay-incomplete, and governance-incomplete nodes", () => {
    const nodes = [
      node("node-a"),
      node("node-blocked", { state: "BLOCKED", blocker_refs: ["blocker-a"] }),
      node("node-conflicted", { state: "CONFLICT_DETECTED", conflict_refs: ["conflict-a"] }),
      node("node-superseded", { state: "SUPERSEDED" }),
      node("node-archived", { state: "ARCHIVED" }),
      node("node-cert", { state: "CERTIFICATION_REQUIRED" }),
      node("node-replay", { replay_refs: [] }),
      node("node-governance", { governance_refs: [] }),
    ];
    const result = order(nodes, [
      relationship("node-a", "node-blocked", "supports"),
      relationship("node-a", "node-conflicted", "supports"),
      relationship("node-a", "node-superseded", "supports"),
      relationship("node-a", "node-archived", "supports"),
      relationship("node-a", "node-cert", "supports"),
      relationship("node-a", "node-replay", "supports"),
      relationship("node-a", "node-governance", "supports"),
    ]);

    expect(result.ordering_status).toBe("PASS");
    expect(result.ordered_node_ids).toEqual(["node-a"]);
    expect(result.excluded_node_ids).toEqual(["node-archived", "node-blocked", "node-cert", "node-conflicted", "node-governance", "node-replay", "node-superseded"]);
    expect(result.reasonCodes).toContain("BLOCKED_NODES_EXCLUDED");
    expect(result.reasonCodes).toContain("CONFLICTED_NODES_EXCLUDED");
    expect(result.reasonCodes).toContain("SUPERSEDED_NODES_EXCLUDED");
    expect(result.reasonCodes).toContain("ARCHIVED_NODES_EXCLUDED");
  });

  it("preserves governance and authority precedence evidence", () => {
    const nodes = [
      node("node-a", { authority_refs: ["authority-a"] }),
      node("node-b", { authority_refs: ["authority-b"] }),
    ];
    const result = order(nodes, [relationship("node-b", "node-a"), relationship("node-a", "node-b", "supports")]);

    expect(result.ordering_status).toBe("PASS");
    expect(result.ordering_record?.governance_refs).toEqual(["governance-node-a", "governance-node-b"]);
    expect(result.ordering_record?.authority_refs).toEqual(["authority-a", "authority-b"]);
    expect(result.reasonCodes).toContain("GOVERNANCE_PRECEDENCE_PRESERVED");
    expect(result.reasonCodes).toContain("AUTHORITY_PRECEDENCE_PRESERVED");
  });

  it("fails closed on unsafe graph, integrity mismatch, hidden/random ordering, graph version mismatch, and replay divergence", () => {
    const nodes = [node("node-a"), node("node-b")];
    const relationships = [relationship("node-b", "node-a"), relationship("node-a", "node-b", "supports")];
    const unsafe = orderDecisionGraph({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      graph_version: "decision-graph/v1",
      nodes,
      relationships,
      graph_safety: validateGraphSafety({ graph_id: "graph-alpha", tenant_id: "tenant-alpha", mission_id: "mission-alpha", graph_version: "decision-graph/v1", nodes, relationships: [relationship("node-a", "node-b"), relationship("node-b", "node-a")] }),
    });
    const integrity = order(nodes, [relationship("node-b", "node-a", "depends_on", { integrity_hash: "tampered" }), relationship("node-a", "node-b", "supports")], {
      graph_safety: safeGraph(nodes, relationships),
    });
    const hidden = order(nodes, relationships, { hidden_ordering_refs: ["hidden"] });
    const random = order(nodes, relationships, { random_ordering_requested: true });
    const version = order(nodes, relationships, { expected_graph_version: "other-version" });
    const base = order(nodes, relationships);
    const replay = order(nodes, relationships, { replay_expected_hash: `${base.replay_hash}-wrong` });

    expect(unsafe.reasonCodes).toContain("GRAPH_SAFETY_INVALID");
    expect(integrity.reasonCodes).toContain("GRAPH_INTEGRITY_MISMATCH");
    expect(hidden.reasonCodes).toContain("HIDDEN_ORDERING_LOGIC_REJECTED");
    expect(random.reasonCodes).toContain("RANDOM_ORDERING_REJECTED");
    expect(version.reasonCodes).toContain("GRAPH_INTEGRITY_MISMATCH");
    expect(replay.reasonCodes).toContain("REPLAY_MISMATCH_DETECTED");
  });
});
