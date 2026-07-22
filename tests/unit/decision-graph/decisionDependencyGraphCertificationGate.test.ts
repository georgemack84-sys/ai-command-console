import { describe, expect, it } from "vitest";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import {
  certifyDecisionDependencyGraph,
  computeDecisionGraphNodeIntegrityHash,
  orderDecisionGraph,
  persistDecisionGraphLedger,
  validateGraphSafety,
  type CanonicalDecisionRelationshipType,
  type DecisionDependencyGraphCertificationInput,
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

function certificationInput(overrides: Partial<DecisionDependencyGraphCertificationInput> = {}): DecisionDependencyGraphCertificationInput {
  const nodes = overrides.nodes ?? [node("node-a"), node("node-b"), node("node-c")];
  const relationships = overrides.relationships ?? [
    relationship("node-b", "node-a"),
    relationship("node-c", "node-b"),
    relationship("node-a", "node-b", "supports"),
    relationship("node-b", "node-c", "supports"),
  ];
  const graphSafety = overrides.graph_safety ?? validateGraphSafety({
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    graph_version: "decision-graph/v1",
    nodes,
    relationships,
  });
  const graphOrdering = overrides.graph_ordering ?? orderDecisionGraph({
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    graph_version: "decision-graph/v1",
    nodes,
    relationships,
    graph_safety: graphSafety,
  });
  const graphLedger = overrides.graph_ledger ?? persistDecisionGraphLedger({
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    graph_version: "decision-graph/v1",
    nodes,
    relationships,
    graph_safety: graphSafety,
    graph_ordering: graphOrdering,
  });

  return {
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    graph_version: "decision-graph/v1",
    nodes,
    relationships,
    graph_safety: graphSafety,
    graph_ordering: graphOrdering,
    graph_ledger: graphLedger,
    constitutional_refs: ["constitutional-alpha"],
    ...overrides,
  };
}

describe("decisionDependencyGraphCertificationGate", () => {
  it("certifies a deterministic, replayable, ledger-backed graph for production orchestration", () => {
    const first = certifyDecisionDependencyGraph(certificationInput());
    const second = certifyDecisionDependencyGraph(certificationInput());

    expect(first).toEqual(second);
    expect(first.certification_state).toBe("PASS");
    expect(first.production_ready).toBe(true);
    expect(first.test_results.every((test) => test.actual === "PASS")).toBe(true);
    expect(first.certification_record.overall_score).toBe(1);
    expect(first.replay_record.comparison_result).toBe("MATCH");
    expect(first.evidence_package.constitutional_evidence_refs).toEqual(["constitutional-alpha"]);
    expect(first.report.certification_decision).toContain("PASS");
    expect(first.ledger_record.certification_state).toBe("PASS");
    expect(first.reasonCodes).toContain("GRAPH_SAFE_FOR_ORCHESTRATION");
    expect(first.reasonCodes).toContain("CERTIFICATION_LEDGER_RECORDED");
  });

  it("fails closed when conflicts, blockers, cycles, missing constitutional evidence, hidden logic, replay mismatch, or tenant violations appear", () => {
    const conflicted = certifyDecisionDependencyGraph(certificationInput({
      nodes: [node("node-a"), node("node-b", { state: "CONFLICT_DETECTED", conflict_refs: ["conflict-a"] }), node("node-c")],
    }));
    const blocked = certifyDecisionDependencyGraph(certificationInput({
      nodes: [node("node-a"), node("node-b", { state: "BLOCKED", blocker_refs: ["blocker-a"] }), node("node-c")],
    }));
    const cycleNodes = [node("node-a"), node("node-b")];
    const cycleRelationships = [relationship("node-a", "node-b"), relationship("node-b", "node-a")];
    const unsafe = certifyDecisionDependencyGraph(certificationInput({
      nodes: cycleNodes,
      relationships: cycleRelationships,
    }));
    const constitutional = certifyDecisionDependencyGraph(certificationInput({ constitutional_refs: [] }));
    const hidden = certifyDecisionDependencyGraph(certificationInput({ hidden_certification_refs: ["hidden"] }));
    const base = certifyDecisionDependencyGraph(certificationInput());
    const replay = certifyDecisionDependencyGraph(certificationInput({ replay_expected_hash: `${base.replay_hash}-wrong` }));
    const crossTenant = certifyDecisionDependencyGraph(certificationInput({
      nodes: [node("node-a", { tenant_id: "tenant-beta" }), node("node-b"), node("node-c")],
    }));

    expect(conflicted.certification_state).toBe("FAIL");
    expect(conflicted.reasonCodes).toContain("UNRESOLVED_CONFLICT_EXISTS");
    expect(blocked.reasonCodes).toContain("UNRESOLVED_BLOCKER_EXISTS");
    expect(unsafe.reasonCodes).toContain("CYCLE_EXISTS");
    expect(unsafe.reasonCodes).toContain("GRAPH_SAFETY_FAILURE");
    expect(constitutional.reasonCodes).toContain("CONSTITUTIONAL_VALIDATION_FAILED");
    expect(hidden.reasonCodes).toContain("HIDDEN_CERTIFICATION_LOGIC_REJECTED");
    expect(replay.reasonCodes).toContain("REPLAY_MISMATCH_DETECTED");
    expect(crossTenant.reasonCodes).toContain("TENANT_ISOLATION_VIOLATED");
  });
});
