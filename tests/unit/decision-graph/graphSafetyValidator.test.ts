import { describe, expect, it } from "vitest";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import {
  computeDecisionGraphNodeIntegrityHash,
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
    authority_refs: [`authority-${nodeId}`],
    simulation_refs: [],
    recovery_refs: [],
    certification_refs: [],
    replay_refs: [`replay-${nodeId}`],
    source_candidate_hash: `candidate-hash-${nodeId}`,
    created_at: "source-record",
    updated_at: "source-record",
    ...overrides,
  } satisfies DecisionGraphRoadmapNodeInput;

  return Object.freeze({ ...base, integrity_hash: computeDecisionGraphNodeIntegrityHash(base) } satisfies DecisionGraphRoadmapNodeInput);
}

function recordHash(record: Omit<DecisionRelationshipRecord, "integrity_hash">): string {
  return generateDecisionIntegrityHash(record);
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

  return Object.freeze({ ...base, integrity_hash: overrides.integrity_hash ?? recordHash(base) } satisfies DecisionRelationshipRecord);
}

function validate(
  relationships: readonly DecisionRelationshipRecord[],
  nodes: readonly DecisionGraphRoadmapNodeInput[] = [node("node-a"), node("node-b"), node("node-c")],
  overrides: Partial<Parameters<typeof validateGraphSafety>[0]> = {},
) {
  return validateGraphSafety({
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    graph_version: "decision-graph/v1",
    nodes,
    relationships,
    ...overrides,
  });
}

describe("graphSafetyValidator", () => {
  it("validates a safe connected acyclic graph deterministically", () => {
    const relationships = [
      relationship("node-a", "node-b"),
      relationship("node-b", "node-c"),
    ];
    const first = validate(relationships);
    const second = validate(relationships);

    expect(first).toEqual(second);
    expect(first.safety_status).toBe("SAFE");
    expect(first.certificationStatus).toBe("PASS");
    expect(first.cycles).toEqual([]);
    expect(first.safety_record.cycle_count).toBe(0);
    expect(first.eligible_for_ordering_node_ids).toEqual(["node-a", "node-b", "node-c"]);
    expect(first.reasonCodes).toContain("ACYCLIC_DEPENDENCY_GRAPH_VALIDATED");
    expect(first.reasonCodes).toContain("REPLAY_RECONSTRUCTS_IDENTICAL_CYCLES");
  });

  it("detects self, direct, and indirect dependency cycles and blocks participating nodes", () => {
    const self = validate([relationship("node-a", "node-a")], [node("node-a")]);
    const direct = validate([
      relationship("node-a", "node-b"),
      relationship("node-b", "node-a"),
    ], [node("node-a"), node("node-b")]);
    const indirect = validate([
      relationship("node-a", "node-b"),
      relationship("node-b", "node-c"),
      relationship("node-c", "node-a"),
    ]);

    expect(self.cycles[0].cycle_type).toBe("SELF_REFERENCE");
    expect(self.reasonCodes).toContain("SELF_REFERENTIAL_CYCLE_DETECTED");
    expect(direct.cycles[0].cycle_type).toBe("DIRECT_CYCLE");
    expect(direct.reasonCodes).toContain("DIRECT_CYCLE_DETECTED");
    expect(indirect.cycles[0].cycle_type).toBe("INDIRECT_CYCLE");
    expect(indirect.reasonCodes).toContain("INDIRECT_CYCLE_DETECTED");
    expect(indirect.updated_nodes.find((item) => item.node_id === "node-a")?.state).toBe("BLOCKED");
    expect(indirect.blocked_node_ids).toEqual(["node-a", "node-b", "node-c"]);
    expect(indirect.loop_reports[0].recommended_remediation).toContain("Break relationship");
  });

  it("classifies governance, authority, certification, recovery, simulation, and escalation loops", () => {
    const cases: Array<[CanonicalDecisionRelationshipType, string]> = [
      ["requires_governance_review", "GOVERNANCE_DEADLOCK"],
      ["requires_operator_approval", "AUTHORITY_DEADLOCK"],
      ["requires_certification", "CERTIFICATION_LOOP"],
      ["requires_recovery_plan", "RECOVERY_LOOP"],
      ["requires_simulation", "SIMULATION_LOOP"],
      ["escalates_to", "ESCALATION_LOOP"],
    ];

    for (const [type, expected] of cases) {
      const result = validate([
        relationship("node-a", "node-b", type),
        relationship("node-b", "node-a", type),
      ], [node("node-a"), node("node-b")]);

      expect(result.cycles[0].cycle_type).toBe(expected);
      expect(result.safety_status).toBe("UNSAFE");
    }
  });

  it("detects unsafe topology including orphan nodes, unreachable nodes, duplicate edges, and graph version mismatch", () => {
    const orphan = validate([relationship("node-a", "node-b")]);
    const duplicate = validate([
      relationship("node-a", "node-b"),
      relationship("node-a", "node-b", "depends_on", { relationship_id: "relationship-duplicate" }),
    ], [node("node-a"), node("node-b")]);
    const versionMismatch = validate([relationship("node-a", "node-b")], [node("node-a"), node("node-b")], {
      expected_graph_version: "other-version",
    });

    expect(orphan.reasonCodes).toContain("ORPHAN_NODE_DETECTED");
    expect(orphan.reasonCodes).toContain("UNREACHABLE_NODE_DETECTED");
    expect(duplicate.reasonCodes).toContain("DUPLICATE_EDGE_DETECTED");
    expect(versionMismatch.reasonCodes).toContain("GRAPH_VERSION_MISMATCH");
    expect(versionMismatch.certificationStatus).toBe("FAIL");
  });

  it("fails closed on cross-scope topology, integrity mismatch, hidden topology, and replay mismatch", () => {
    const crossTenant = validate([relationship("node-a", "node-b")], [node("node-a"), node("node-b", { tenant_id: "tenant-beta" })]);
    const integrityMismatch = validate([relationship("node-a", "node-b", "depends_on", { integrity_hash: "tampered" })], [node("node-a"), node("node-b")]);
    const hidden = validate([relationship("node-a", "node-b")], [node("node-a"), node("node-b")], {
      hidden_topology_refs: ["hidden-edge"],
    });
    const base = validate([relationship("node-a", "node-b")], [node("node-a"), node("node-b")]);
    const replayMismatch = validate([relationship("node-a", "node-b")], [node("node-a"), node("node-b")], {
      replay_expected_hash: `${base.replay_hash}-wrong`,
    });

    expect(crossTenant.reasonCodes).toContain("CROSS_TENANT_TOPOLOGY_DETECTED");
    expect(integrityMismatch.reasonCodes).toContain("RELATIONSHIP_INTEGRITY_MISMATCH");
    expect(hidden.reasonCodes).toContain("HIDDEN_TOPOLOGY_DETECTED");
    expect(replayMismatch.reasonCodes).toContain("REPLAY_MISMATCH_DETECTED");
  });
});
