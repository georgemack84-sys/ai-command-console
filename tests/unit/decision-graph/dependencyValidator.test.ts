import { describe, expect, it } from "vitest";
import {
  computeDecisionGraphNodeIntegrityHash,
  resolveDecisionRelationships,
  validateDecisionDependencies,
  type DecisionGraphRoadmapNodeInput,
  type DecisionRelationshipHint,
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
    evidence_refs: [`evidence-${source_node_id}-${target_ref}`],
    ...overrides,
  } satisfies DecisionRelationshipHint);
}

function resolvedGraph(
  relationshipHints: readonly DecisionRelationshipHint[] = [hint("node-a", "node-b", "depends_on")],
  graphNodes: readonly DecisionGraphRoadmapNodeInput[] = [node("node-a"), node("node-b"), node("node-c")],
) {
  const resolved = resolveDecisionRelationships({
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    nodes: graphNodes,
    relationship_hints: relationshipHints,
  });
  expect(resolved.resolution_status).toBe("PASS");
  return resolved;
}

function validateWith(
  override: Partial<Parameters<typeof validateDecisionDependencies>[0]> = {},
  relationshipHints: readonly DecisionRelationshipHint[] = [hint("node-a", "node-b", "depends_on")],
) {
  const resolved = resolvedGraph(relationshipHints);
  return validateDecisionDependencies({
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    nodes: resolved.updated_nodes,
    relationships: resolved.relationships,
    lineage: resolved.lineage,
    ...override,
  });
}

describe("dependencyValidator", () => {
  it("validates complete dependency relationships and emits immutable replayable evidence", () => {
    const result = validateWith();

    expect(result.validation_status).toBe("PASS");
    expect(result.certificationStatus).toBe("PASS");
    expect(result.validation_records).toHaveLength(1);
    expect(result.validation_records[0].dependency_status).toBe("COMPLETE");
    expect(result.validation_records[0].governance_status).toBe("VERIFIED");
    expect(result.validation_records[0].replay_status).toBe("VERIFIED");
    expect(result.missing_dependencies).toEqual([]);
    expect(result.ledger_events).toHaveLength(1);
    expect(result.report.ready_node_ids).toContain("node-a");
    expect(result.updated_nodes.find((item) => item.node_id === "node-a")?.state).toBe("DEPENDENCY_VALIDATED");
    expect(result.reasonCodes).toContain("IMMUTABLE_VALIDATION_EVIDENCE_PRODUCED");
    expect(result.reasonCodes).toContain("REPLAY_RECONSTRUCTS_IDENTICAL_VALIDATION");
  });

  it("validates approval, governance, simulation, recovery, and certification dependency requirements", () => {
    const result = validateWith({}, [
      hint("node-a", "operator-approval", "requires_operator_approval", { target_type: "OPERATOR" }),
      hint("node-a", "governance-review", "requires_governance_review", { target_type: "GOVERNANCE" }),
      hint("node-b", "simulation-run", "requires_simulation", { target_type: "SIMULATION" }),
      hint("node-b", "recovery-plan", "requires_recovery_plan", { target_type: "RECOVERY" }),
      hint("node-c", "certification-gate", "requires_certification", { target_type: "CERTIFICATION" }),
    ]);

    expect(result.validation_status).toBe("PASS");
    expect(result.validation_records.map((record) => record.dependency_type).sort()).toEqual([
      "requires_certification",
      "requires_governance_review",
      "requires_operator_approval",
      "requires_recovery_plan",
      "requires_simulation",
    ]);
    expect(result.report.ready_node_ids).toEqual(["node-a", "node-b", "node-c"]);
  });

  it("detects missing expected dependencies and keeps affected nodes unvalidated", () => {
    const result = validateWith({
      expected_dependencies: [{
        node_id: "node-a",
        expected_dependency: "certification-gate",
        dependency_type: "requires_certification",
        reason: "REQUIRED_CERTIFICATION_MISSING",
        required_before_state: "READY_FOR_ORDERING",
        governance_refs: ["governance-certification"],
        replay_refs: ["replay-certification"],
      }],
    });

    expect(result.validation_status).toBe("FAIL");
    expect(result.missing_dependencies).toHaveLength(1);
    expect(result.missing_dependencies[0].reason).toBe("REQUIRED_CERTIFICATION_MISSING");
    expect(result.report.blocked_node_ids).toContain("node-a");
    expect(result.reasonCodes).toContain("REQUIRED_CERTIFICATION_MISSING");
  });

  it("rejects invalid dependency references, missing lineage, missing governance, missing replay, and integrity mismatch", () => {
    const resolved = resolvedGraph();
    const missingLineage = validateDecisionDependencies({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: resolved.updated_nodes,
      relationships: resolved.relationships,
      lineage: [],
    });
    const noGovernance = validateDecisionDependencies({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: resolved.updated_nodes,
      relationships: [{ ...resolved.relationships[0], governance_refs: [] }],
      lineage: resolved.lineage,
    });
    const noReplay = validateDecisionDependencies({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: resolved.updated_nodes,
      relationships: [{ ...resolved.relationships[0], replay_refs: [] }],
      lineage: resolved.lineage,
    });
    const integrityMismatch = validateDecisionDependencies({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: resolved.updated_nodes,
      relationships: [{ ...resolved.relationships[0], relationship_basis: ["tampered"] }],
      lineage: resolved.lineage,
    });
    const missingNode = validateDecisionDependencies({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: resolved.updated_nodes.filter((item) => item.node_id !== "node-b"),
      relationships: resolved.relationships,
      lineage: resolved.lineage,
    });

    expect(missingLineage.reasonCodes).toContain("RELATIONSHIP_LINEAGE_MISSING");
    expect(noGovernance.reasonCodes).toContain("GOVERNANCE_VIOLATION");
    expect(noReplay.reasonCodes).toContain("MISSING_REPLAY_REFERENCE");
    expect(integrityMismatch.reasonCodes).toContain("DEPENDENCY_INTEGRITY_MISMATCH");
    expect(missingNode.reasonCodes).toContain("PREREQUISITE_DECISION_MISSING");
  });

  it("detects cross-scope dependencies, unresolved prerequisite state, cycles, duplicates, and replay divergence", () => {
    const resolved = resolvedGraph();
    const crossTenant = validateDecisionDependencies({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: resolved.updated_nodes.map((item) => item.node_id === "node-b" ? node("node-b", { tenant_id: "tenant-beta", state: "RELATIONSHIPS_RESOLVED" }) : item),
      relationships: resolved.relationships,
      lineage: resolved.lineage,
    });
    const notReady = validateDecisionDependencies({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: resolved.updated_nodes.map((item) => item.node_id === "node-b" ? node("node-b", { state: "REGISTERED" }) : item),
      relationships: resolved.relationships,
      lineage: resolved.lineage,
    });
    const cycleResolved = resolvedGraph([
      hint("node-a", "node-b", "depends_on"),
      hint("node-b", "node-a", "supports"),
    ]);
    const cycleRelationship: DecisionRelationshipRecord = {
      ...cycleResolved.relationships[1],
      relationship_type: "depends_on",
    };
    const cycle = validateDecisionDependencies({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: cycleResolved.updated_nodes,
      relationships: [cycleResolved.relationships[0], cycleRelationship],
      lineage: cycleResolved.lineage,
    });
    const duplicate = validateDecisionDependencies({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: resolved.updated_nodes,
      relationships: [resolved.relationships[0], resolved.relationships[0]],
      lineage: resolved.lineage,
    });
    const replayDivergence = validateDecisionDependencies({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: resolved.updated_nodes,
      relationships: resolved.relationships,
      lineage: resolved.lineage,
      replay_expected_hash: "wrong-replay-hash",
    });

    expect(crossTenant.reasonCodes).toContain("CROSS_TENANT_DEPENDENCY");
    expect(notReady.reasonCodes).toContain("DEPENDENCY_NOT_READY");
    expect(cycle.reasonCodes).toContain("DEPENDENCY_CYCLE_DETECTED");
    expect(duplicate.reasonCodes).toContain("DUPLICATE_DEPENDENCY");
    expect(replayDivergence.reasonCodes).toContain("REPLAY_DIVERGENCE");
  });
});
