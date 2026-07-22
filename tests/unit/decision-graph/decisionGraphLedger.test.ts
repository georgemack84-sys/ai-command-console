import { describe, expect, it } from "vitest";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import {
  computeDecisionGraphNodeIntegrityHash,
  orderDecisionGraph,
  persistDecisionGraphLedger,
  validateGraphSafety,
  type CanonicalDecisionRelationshipType,
  type DecisionGraphLedgerInput,
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

function graphInput(overrides: Partial<DecisionGraphLedgerInput> = {}): DecisionGraphLedgerInput {
  const nodes = [node("node-a"), node("node-b"), node("node-c")];
  const relationships = [
    relationship("node-b", "node-a"),
    relationship("node-c", "node-b"),
    relationship("node-a", "node-b", "supports"),
    relationship("node-b", "node-c", "supports"),
  ];
  const graphSafety = validateGraphSafety({
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    graph_version: "decision-graph/v1",
    nodes,
    relationships,
  });
  const graphOrdering = orderDecisionGraph({
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    graph_version: "decision-graph/v1",
    nodes,
    relationships,
    graph_safety: graphSafety,
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
    ...overrides,
  };
}

describe("decisionGraphLedger", () => {
  it("persists graph lifecycle events as a deterministic append-only replay ledger", () => {
    const first = persistDecisionGraphLedger(graphInput());
    const second = persistDecisionGraphLedger(graphInput());

    expect(first).toEqual(second);
    expect(first.ledger_status).toBe("PASS");
    expect(first.ledger_entries.map((entry) => entry.entry_type)).toEqual([
      "GRAPH_CREATED",
      "NODE_REGISTERED",
      "NODE_REGISTERED",
      "NODE_REGISTERED",
      "RELATIONSHIP_CREATED",
      "RELATIONSHIP_CREATED",
      "RELATIONSHIP_CREATED",
      "RELATIONSHIP_CREATED",
      "GRAPH_ORDERED",
      "GRAPH_SNAPSHOT",
      "REPLAY_VALIDATED",
    ]);
    expect(first.ledger_entries[0].previous_entry_hash).toBe("GENESIS");
    expect(first.ledger_entries.at(-1)?.integrity_hash).toBeDefined();
    expect(first.snapshot_record?.ordering_state).toBe("ORDERED");
    expect(first.relationship_ledger).toHaveLength(4);
    expect(first.integrity_records.every((record) => record.validation_result === "PASS")).toBe(true);
    expect(first.replay_record?.comparison_result).toBe("MATCH");
    expect(first.reasonCodes).toContain("GRAPH_ORDERING_RECORDED");
    expect(first.reasonCodes).toContain("REPLAY_RECONSTRUCTS_IDENTICAL_GRAPH");
  });

  it("continues an existing ledger only from the last validated entry hash", () => {
    const first = persistDecisionGraphLedger(graphInput());
    const expectedPrevious = first.ledger_entries.at(-1)!.integrity_hash;
    const appended = persistDecisionGraphLedger(graphInput({
      existing_entries: first.ledger_entries,
      expected_previous_entry_hash: expectedPrevious,
    }));
    const rejected = persistDecisionGraphLedger(graphInput({
      existing_entries: first.ledger_entries,
      expected_previous_entry_hash: "wrong-previous-hash",
    }));

    expect(appended.ledger_status).toBe("PASS");
    expect(appended.ledger_entries[0].previous_entry_hash).toBe(expectedPrevious);
    expect(appended.ledger_entries[0].sequence).toBe(first.ledger_entries.length + 1);
    expect(rejected.ledger_status).toBe("FAIL");
    expect(rejected.reasonCodes).toContain("APPEND_ONLY_RULE_VIOLATED");
  });

  it("fails closed on tampering, cross-tenant events, missing lineage, hidden mutation, graph version mismatch, and replay divergence", () => {
    const valid = persistDecisionGraphLedger(graphInput());
    const tamperedEntry = Object.freeze({ ...valid.ledger_entries[0], graph_version: "mutated-version" });
    const tampered = persistDecisionGraphLedger(graphInput({ existing_entries: [tamperedEntry] }));
    const crossTenant = persistDecisionGraphLedger(graphInput({ nodes: [node("node-a", { tenant_id: "tenant-beta" })] }));
    const missingLineage = persistDecisionGraphLedger(graphInput({ relationships: [relationship("node-a", "node-b", "supports", { source_candidate_refs: [] })] }));
    const hidden = persistDecisionGraphLedger(graphInput({ hidden_mutation_refs: ["hidden"] }));
    const version = persistDecisionGraphLedger(graphInput({ expected_graph_version: "other-version" }));
    const replay = persistDecisionGraphLedger(graphInput({ replay_expected_hash: `${valid.replay_hash}-wrong` }));

    expect(tampered.reasonCodes).toContain("INTEGRITY_HASH_MISMATCH");
    expect(crossTenant.reasonCodes).toContain("TENANT_ISOLATION_VIOLATED");
    expect(missingLineage.reasonCodes).toContain("RELATIONSHIP_LINEAGE_MISSING");
    expect(hidden.reasonCodes).toContain("HIDDEN_LEDGER_MUTATION_DETECTED");
    expect(version.reasonCodes).toContain("GRAPH_VERSION_MISMATCH");
    expect(replay.reasonCodes).toContain("REPLAY_RECONSTRUCTION_IMPOSSIBLE");
  });
});
