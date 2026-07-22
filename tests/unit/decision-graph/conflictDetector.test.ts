import { describe, expect, it } from "vitest";
import {
  computeDecisionGraphNodeIntegrityHash,
  detectDecisionConflicts,
  resolveDecisionRelationships,
  type ConflictSignal,
  type DecisionConflictType,
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

  return Object.freeze({
    ...base,
    integrity_hash: computeDecisionGraphNodeIntegrityHash(base),
  } satisfies DecisionGraphRoadmapNodeInput);
}

function relationshipHint(
  source_node_id: string,
  target_ref: string,
  overrides: Partial<DecisionRelationshipHint> = {},
): DecisionRelationshipHint {
  return Object.freeze({
    source_node_id,
    target_ref,
    relationship_type: "conflicts_with",
    relationship_basis: [`basis-${source_node_id}-${target_ref}`],
    confidence_basis: [`confidence-${source_node_id}`],
    governance_refs: [`governance-${source_node_id}-${target_ref}`],
    replay_refs: [`replay-${source_node_id}-${target_ref}`],
    evidence_refs: [`evidence-${source_node_id}-${target_ref}`],
    ...overrides,
  } satisfies DecisionRelationshipHint);
}

function signal(
  source_node_id: string,
  target_node_id: string,
  conflict_type: DecisionConflictType,
  overrides: Partial<ConflictSignal> = {},
): ConflictSignal {
  return Object.freeze({
    source_node_id,
    target_node_id,
    conflict_type,
    rule_id: `rule-${conflict_type.toLowerCase()}`,
    conflict_reason: `${conflict_type} prevents simultaneous orchestration.`,
    evidence_refs: [`evidence-${conflict_type.toLowerCase()}`],
    risk_refs: [`risk-${conflict_type.toLowerCase()}`],
    governance_refs: [`governance-${conflict_type.toLowerCase()}`],
    authority_refs: conflict_type === "AUTHORITY_CONFLICT" ? [`authority-${source_node_id}`] : [],
    replay_refs: [`replay-${conflict_type.toLowerCase()}`],
    ...overrides,
  } satisfies ConflictSignal);
}

function resolvedConflictGraph(graphNodes: readonly DecisionGraphRoadmapNodeInput[] = [node("node-a"), node("node-b"), node("node-c")]) {
  const resolved = resolveDecisionRelationships({
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    nodes: graphNodes,
    relationship_hints: [relationshipHint("node-a", "node-b")],
  });
  expect(resolved.resolution_status).toBe("PASS");
  return resolved;
}

function detect(conflict_signals: readonly ConflictSignal[] = [], graphNodes: readonly DecisionGraphRoadmapNodeInput[] = [node("node-a"), node("node-b"), node("node-c")]) {
  const resolved = resolvedConflictGraph(graphNodes);
  return detectDecisionConflicts({
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    nodes: resolved.updated_nodes,
    relationships: resolved.relationships,
    lineage: resolved.lineage,
    conflict_signals,
  });
}

describe("conflictDetector", () => {
  it("detects resolver conflict relationships, attaches refs, blocks nodes, explains conflicts, and replays deterministically", () => {
    const first = detect();
    const second = detect();

    expect(first).toEqual(second);
    expect(first.detection_status).toBe("PASS");
    expect(first.conflicts).toHaveLength(1);
    expect(first.conflicts[0].conflict_type).toBe("DEPENDENCY_CONFLICT");
    expect(first.explanations).toHaveLength(1);
    expect(first.explanations[0].recommended_resolution_path).toHaveLength(3);
    expect(first.ledger_records).toHaveLength(1);
    expect(first.updated_nodes.find((item) => item.node_id === "node-a")?.state).toBe("CONFLICT_DETECTED");
    expect(first.updated_nodes.find((item) => item.node_id === "node-b")?.conflict_refs).toHaveLength(1);
    expect(first.reasonCodes).toContain("CONFLICT_REFERENCES_ATTACHED");
    expect(first.reasonCodes).toContain("CONFLICTING_NODES_BLOCKED");
    expect(first.reasonCodes).toContain("REPLAY_RECONSTRUCTS_IDENTICAL_CONFLICTS");
  });

  it("classifies policy, authority, mission, tenant, risk, action, certification, and recovery conflicts", () => {
    const result = detect([
      signal("node-a", "node-b", "POLICY_CONFLICT"),
      signal("node-b", "node-c", "AUTHORITY_CONFLICT"),
      signal("node-c", "node-a", "MISSION_OBJECTIVE_CONFLICT"),
      signal("node-a", "node-c", "TENANT_SCOPE_CONFLICT"),
      signal("node-b", "node-a", "RISK_CONFLICT"),
      signal("node-c", "node-b", "ACTION_CONFLICT"),
      signal("node-a", "node-b", "CERTIFICATION_CONFLICT", { rule_id: "rule-certification" }),
      signal("node-b", "node-c", "RECOVERY_CONFLICT", { rule_id: "rule-recovery" }),
    ]);

    expect(result.detection_status).toBe("PASS");
    expect(result.conflicts.map((item) => item.conflict_type).sort()).toEqual([
      "ACTION_CONFLICT",
      "AUTHORITY_CONFLICT",
      "CERTIFICATION_CONFLICT",
      "DEPENDENCY_CONFLICT",
      "MISSION_OBJECTIVE_CONFLICT",
      "POLICY_CONFLICT",
      "RECOVERY_CONFLICT",
      "RISK_CONFLICT",
      "TENANT_SCOPE_CONFLICT",
    ]);
    expect(result.reasonCodes).toContain("COMPETING_PROPOSED_ACTIONS_DETECTED");
    expect(result.reasonCodes).toContain("AUTHORITY_MISMATCH_DETECTED");
    expect(result.reasonCodes).toContain("MISSION_OBJECTIVE_CONFLICT_DETECTED");
    expect(result.reasonCodes).toContain("TENANT_BOUNDARY_CONFLICT_DETECTED");
    expect(result.reasonCodes).toContain("CONTRADICTORY_RISK_RESPONSES_DETECTED");
    expect(result.reasonCodes).toContain("CERTIFICATION_CONFLICT_DETECTED");
    expect(result.reasonCodes).toContain("RECOVERY_POSTURE_CONFLICT_DETECTED");
  });

  it("assigns deterministic severity and prevents duplicate conflict registration", () => {
    const duplicate = signal("node-a", "node-b", "POLICY_CONFLICT");
    const result = detect([duplicate, duplicate]);

    expect(result.detection_status).toBe("PASS");
    expect(result.conflicts.filter((item) => item.conflict_type === "POLICY_CONFLICT")).toHaveLength(1);
    expect(result.conflicts.find((item) => item.conflict_type === "POLICY_CONFLICT")?.severity).toBe("HIGH");
    expect(result.duplicate_conflict_ids).toHaveLength(1);
    expect(result.reasonCodes).toContain("DUPLICATE_CONFLICT_REGISTRATION_PREVENTED");
  });

  it("rejects hidden conflicts, governance omissions, replay omissions, authority gaps, ambiguity, cross-tenant conflicts, integrity mismatch, and replay mismatch", () => {
    const hidden = detect([signal("node-a", "node-b", "POLICY_CONFLICT", { hidden: true })]);
    const noGovernance = detect([signal("node-a", "node-b", "POLICY_CONFLICT", { governance_refs: [] })]);
    const noReplay = detect([signal("node-a", "node-b", "POLICY_CONFLICT", { replay_refs: [] })]);
    const noAuthority = detect([signal("node-a", "node-b", "AUTHORITY_CONFLICT", { authority_refs: [] })]);
    const ambiguous = detect([signal("node-a", "node-b", "POLICY_CONFLICT", { ambiguous: true })]);
    const crossTenant = detectDecisionConflicts({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: [node("node-a"), node("node-b", { tenant_id: "tenant-beta" })],
      relationships: [],
      lineage: [],
      conflict_signals: [signal("node-a", "node-b", "TENANT_SCOPE_CONFLICT")],
    });
    const resolved = resolvedConflictGraph();
    const mismatch = detectDecisionConflicts({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: resolved.updated_nodes,
      relationships: [{ ...resolved.relationships[0], relationship_basis: ["tampered"] }],
      lineage: resolved.lineage,
    });
    const base = detect();
    const replayMismatch = detectDecisionConflicts({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: resolved.updated_nodes,
      relationships: resolved.relationships,
      lineage: resolved.lineage,
      replay_expected_hash: `${base.replay_hash}-wrong`,
    });

    expect(hidden.reasonCodes).toContain("HIDDEN_CONFLICT_DISCOVERED");
    expect(noGovernance.reasonCodes).toContain("GOVERNANCE_REFERENCES_MISSING");
    expect(noReplay.reasonCodes).toContain("REPLAY_REFERENCES_MISSING");
    expect(noAuthority.reasonCodes).toContain("AUTHORITY_VALIDATION_INCOMPLETE");
    expect(ambiguous.reasonCodes).toContain("RULE_AMBIGUITY_DETECTED");
    expect(crossTenant.reasonCodes).toContain("TENANT_BOUNDARY_VIOLATED");
    expect(mismatch.reasonCodes).toContain("GRAPH_INTEGRITY_MISMATCH");
    expect(replayMismatch.reasonCodes).toContain("REPLAY_MISMATCH_DETECTED");
  });
});
