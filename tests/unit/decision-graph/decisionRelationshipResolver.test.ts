import { describe, expect, it } from "vitest";
import {
  computeDecisionGraphNodeIntegrityHash,
  resolveDecisionRelationships,
  type DecisionGraphRoadmapNodeInput,
  type DecisionRelationshipHint,
} from "@/services/decision-graph";

function node(nodeId: string, overrides: Partial<DecisionGraphRoadmapNodeInput> = {}): DecisionGraphRoadmapNodeInput {
  const base = {
    node_id: nodeId,
    decision_candidate_id: `candidate-${nodeId}`,
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    decision_type: "RECOMMENDATION",
    priority: 0,
    state: "RELATIONSHIPS_PENDING",
    previous_state: "REGISTERED",
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
    created_at: "source-record",
    updated_at: "source-record",
    ...overrides,
  } satisfies DecisionGraphRoadmapNodeInput;

  return Object.freeze({
    ...base,
    integrity_hash: computeDecisionGraphNodeIntegrityHash(base),
  } satisfies DecisionGraphRoadmapNodeInput);
}

function hint(
  source_node_id: string,
  target_ref: string,
  relationship_type: DecisionRelationshipHint["relationship_type"],
  overrides: Partial<DecisionRelationshipHint> = {},
): DecisionRelationshipHint {
  return Object.freeze({
    source_node_id,
    target_ref,
    relationship_type,
    relationship_basis: [`basis-${source_node_id}-${target_ref}-${relationship_type}`],
    confidence_basis: [`confidence-${source_node_id}`],
    governance_refs: [`governance-${source_node_id}-${target_ref}`],
    replay_refs: [`replay-${source_node_id}-${target_ref}-${relationship_type}`],
    ...overrides,
  } satisfies DecisionRelationshipHint);
}

function resolve(
  relationship_hints: readonly DecisionRelationshipHint[],
  nodes: readonly DecisionGraphRoadmapNodeInput[] = [node("node-a"), node("node-b"), node("node-c")],
) {
  return resolveDecisionRelationships({
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    nodes,
    relationship_hints,
  });
}

describe("decisionRelationshipResolver", () => {
  it("processes valid nodes and preserves deterministic relationship direction, lineage, ledger, and replay", () => {
    const input = [hint("node-a", "node-b", "depends_on")];
    const first = resolve(input);
    const second = resolve(input);

    expect(first).toEqual(second);
    expect(first.resolution_status).toBe("PASS");
    expect(first.relationships).toHaveLength(1);
    expect(first.relationships[0].direction).toBe("SOURCE_TO_TARGET");
    expect(first.relationships[0].source_node_id).toBe("node-a");
    expect(first.relationships[0].target_node_id).toBe("node-b");
    expect(first.lineage).toHaveLength(1);
    expect(first.ledger_events).toHaveLength(1);
    expect(first.reasonCodes).toContain("RELATIONSHIP_LINEAGE_RECORDED");
    expect(first.reasonCodes).toContain("REPLAY_RECONSTRUCTS_IDENTICAL_RELATIONSHIPS");
  });

  it("resolves dependency, block, support, weakening, supersession, and escalation families", () => {
    const result = resolve([
      hint("node-a", "node-b", "depends_on"),
      hint("node-b", "node-c", "blocks"),
      hint("node-c", "node-a", "supports"),
      hint("node-a", "node-c", "weakens"),
      hint("node-c", "node-b", "supersedes"),
      hint("node-a", "authority-node-a", "escalates_to", { target_type: "AUTHORITY" }),
    ]);

    expect(result.resolution_status).toBe("PASS");
    expect(result.relationships.map((item) => item.relationship_type).sort()).toEqual([
      "blocks",
      "depends_on",
      "escalates_to",
      "supersedes",
      "supports",
      "weakens",
    ]);
    expect(result.updated_nodes.find((item) => item.node_id === "node-a")?.dependency_refs).toHaveLength(1);
    expect(result.updated_nodes.find((item) => item.node_id === "node-c")?.blocker_refs).toHaveLength(1);
    expect(result.updated_nodes.find((item) => item.node_id === "node-a")?.supporting_refs).toHaveLength(1);
    expect(result.updated_nodes.find((item) => item.node_id === "node-c")?.weakening_refs).toHaveLength(1);
    expect(result.updated_nodes.find((item) => item.node_id === "node-c")?.supersession_refs).toHaveLength(1);
    expect(result.updated_nodes.find((item) => item.node_id === "node-a")?.escalation_refs).toHaveLength(1);
  });

  it("detects operator, governance, simulation, recovery, and certification requirements", () => {
    const result = resolve([
      hint("node-a", "operator-approval", "requires_operator_approval", { target_type: "OPERATOR" }),
      hint("node-a", "governance-review", "requires_governance_review", { target_type: "GOVERNANCE" }),
      hint("node-b", "simulation-run", "requires_simulation", { target_type: "SIMULATION" }),
      hint("node-b", "recovery-plan", "requires_recovery_plan", { target_type: "RECOVERY" }),
      hint("node-c", "certification-gate", "requires_certification", { target_type: "CERTIFICATION" }),
    ]);

    expect(result.resolution_status).toBe("PASS");
    expect(result.relationships).toHaveLength(5);
    expect(result.updated_nodes.find((item) => item.node_id === "node-a")?.blocker_refs).toHaveLength(2);
    expect(result.updated_nodes.find((item) => item.node_id === "node-b")?.simulation_refs).toHaveLength(1);
    expect(result.updated_nodes.find((item) => item.node_id === "node-b")?.recovery_refs).toHaveLength(1);
    expect(result.updated_nodes.find((item) => item.node_id === "node-c")?.certification_refs).toHaveLength(1);
  });

  it("removes exact duplicate relationships deterministically", () => {
    const duplicate = hint("node-a", "node-b", "depends_on");
    const result = resolve([duplicate, duplicate]);

    expect(result.resolution_status).toBe("PASS");
    expect(result.relationships).toHaveLength(1);
    expect(result.removed_duplicate_relationship_ids).toHaveLength(1);
    expect(result.reasonCodes).toContain("DUPLICATE_RELATIONSHIPS_REMOVED");
  });

  it("rejects invalid combinations, self-links, cross-scope links, hidden links, and missing lineage refs", () => {
    const invalidCombination = resolve([
      hint("node-a", "node-b", "depends_on"),
      hint("node-b", "node-a", "depends_on"),
    ]);
    const selfDependency = resolve([hint("node-a", "node-a", "depends_on")]);
    const selfSupersession = resolve([hint("node-a", "node-a", "supersedes")]);
    const crossTenant = resolve([hint("node-a", "node-b", "depends_on")], [node("node-a"), node("node-b", { tenant_id: "tenant-beta" })]);
    const missingGovernance = resolve([hint("node-a", "node-b", "depends_on", { governance_refs: [] })]);
    const missingReplay = resolve([hint("node-a", "node-b", "depends_on", { replay_refs: [] })]);
    const hidden = resolve([hint("node-a", "node-b", "depends_on", { hidden: true })]);

    expect(invalidCombination.resolution_status).toBe("FAIL");
    expect(invalidCombination.reasonCodes).toContain("INVALID_RELATIONSHIP_COMBINATION");
    expect(selfDependency.reasonCodes).toContain("SELF_DEPENDENCY");
    expect(selfSupersession.reasonCodes).toContain("SELF_SUPERSESSION");
    expect(crossTenant.reasonCodes).toContain("CROSS_TENANT_RELATIONSHIP");
    expect(missingGovernance.reasonCodes).toContain("RELATIONSHIP_WITHOUT_GOVERNANCE_REF");
    expect(missingReplay.reasonCodes).toContain("RELATIONSHIP_WITHOUT_REPLAY_REF");
    expect(hidden.reasonCodes).toContain("HIDDEN_RELATIONSHIP");
  });

  it("rejects unknown types, missing endpoints, implicit relationships, duplicate conflicts, and replay divergence", () => {
    const unknown = resolve([hint("node-a", "node-b", "unknown" as DecisionRelationshipHint["relationship_type"])]);
    const missingSource = resolve([hint("missing", "node-b", "depends_on")]);
    const missingTarget = resolve([hint("node-a", "missing", "depends_on")]);
    const implicit = resolveDecisionRelationships({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: [node("node-a"), node("node-b")],
      relationship_hints: [],
      allow_implicit_relationships: true,
    });
    const base = hint("node-a", "node-b", "depends_on");
    const duplicateConflict = resolve([
      base,
      { ...base, confidence_basis: ["different-confidence"] },
    ]);
    const replayBase = resolve([base]);
    const replayDivergence = resolveDecisionRelationships({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: [node("node-a"), node("node-b")],
      relationship_hints: [base],
      replay_expected_hash: `${replayBase.replay_hash}-mismatch`,
    });

    expect(unknown.reasonCodes).toContain("UNKNOWN_RELATIONSHIP_TYPE");
    expect(missingSource.reasonCodes).toContain("RELATIONSHIP_WITH_MISSING_SOURCE_NODE");
    expect(missingTarget.reasonCodes).toContain("RELATIONSHIP_WITH_MISSING_TARGET_NODE");
    expect(implicit.reasonCodes).toContain("IMPLICIT_UNRECORDED_RELATIONSHIP");
    expect(duplicateConflict.reasonCodes).toContain("DUPLICATE_RELATIONSHIP_CONFLICT");
    expect(replayDivergence.reasonCodes).toContain("REPLAY_DIVERGENCE");
  });
});
