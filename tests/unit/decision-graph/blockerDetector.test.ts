import { describe, expect, it } from "vitest";
import {
  computeDecisionGraphNodeIntegrityHash,
  detectDecisionBlockers,
  detectDecisionConflicts,
  resolveDecisionRelationships,
  validateDecisionDependencies,
  type BlockerSignal,
  type DecisionBlockerType,
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
    target_type: relationship_type === "requires_operator_approval" ? "OPERATOR"
      : relationship_type === "requires_governance_review" ? "GOVERNANCE"
        : relationship_type === "requires_simulation" ? "SIMULATION"
          : relationship_type === "requires_recovery_plan" ? "RECOVERY"
            : relationship_type === "requires_certification" ? "CERTIFICATION"
              : "DECISION_NODE",
    relationship_basis: [`basis-${source_node_id}-${target_ref}-${relationship_type}`],
    confidence_basis: [`confidence-${source_node_id}`],
    governance_refs: [`governance-${source_node_id}-${target_ref}`],
    replay_refs: [`replay-${source_node_id}-${target_ref}-${relationship_type}`],
    evidence_refs: [`evidence-${source_node_id}-${target_ref}`],
    ...overrides,
  } satisfies DecisionRelationshipHint);
}

function signal(node_id: string, blocker_type: DecisionBlockerType, overrides: Partial<BlockerSignal> = {}): BlockerSignal {
  return Object.freeze({
    node_id,
    blocker_type,
    blocking_reason: `${blocker_type} prevents graph ordering.`,
    required_action: `resolve_${blocker_type.toLowerCase()}`,
    blocking_dependency_refs: [`dependency-${blocker_type.toLowerCase()}`],
    governance_refs: [`governance-${blocker_type.toLowerCase()}`],
    authority_refs: blocker_type === "AUTHORITY_BLOCKER" ? [`authority-${node_id}`] : [],
    replay_refs: [`replay-${blocker_type.toLowerCase()}`],
    evidence_refs: [`evidence-${blocker_type.toLowerCase()}`],
    ...overrides,
  } satisfies BlockerSignal);
}

function resolvedRequirements() {
  const nodes = [node("node-a"), node("node-b"), node("node-c")];
  const resolved = resolveDecisionRelationships({
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    nodes,
    relationship_hints: [
      hint("node-a", "operator-approval", "requires_operator_approval", { target_type: "OPERATOR" }),
      hint("node-a", "governance-review", "requires_governance_review", { target_type: "GOVERNANCE" }),
      hint("node-b", "simulation-run", "requires_simulation", { target_type: "SIMULATION" }),
      hint("node-b", "recovery-plan", "requires_recovery_plan", { target_type: "RECOVERY" }),
      hint("node-c", "certification-gate", "requires_certification", { target_type: "CERTIFICATION" }),
    ],
  });
  expect(resolved.resolution_status).toBe("PASS");
  return resolved;
}

describe("blockerDetector", () => {
  it("detects requirement blockers, attaches refs, blocks nodes, explains blockers, and replays deterministically", () => {
    const resolved = resolvedRequirements();
    const first = detectDecisionBlockers({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: resolved.updated_nodes,
      relationships: resolved.relationships,
    });
    const second = detectDecisionBlockers({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: resolved.updated_nodes,
      relationships: resolved.relationships,
    });

    expect(first).toEqual(second);
    expect(first.detection_status).toBe("PASS");
    expect(first.blockers.map((item) => item.blocker_type).sort()).toEqual([
      "AUTHORITY_BLOCKER",
      "CERTIFICATION_BLOCKER",
      "GOVERNANCE_BLOCKER",
      "RECOVERY_BLOCKER",
      "SIMULATION_BLOCKER",
    ]);
    expect(first.updated_nodes.find((item) => item.node_id === "node-a")?.state).toBe("BLOCKED");
    expect(first.blocked_node_ids).toEqual(["node-a", "node-b", "node-c"]);
    expect(first.eligible_for_ordering_node_ids).toEqual([]);
    expect(first.eligible_for_approval_node_ids).toEqual([]);
    expect(first.explanations).toHaveLength(5);
    expect(first.ledger_records).toHaveLength(5);
    expect(first.reasonCodes).toContain("BLOCKER_REFERENCES_ATTACHED");
    expect(first.reasonCodes).toContain("BLOCKED_DECISIONS_EXCLUDED_FROM_RANKING");
    expect(first.reasonCodes).toContain("REPLAY_RECONSTRUCTS_IDENTICAL_BLOCKERS");
  });

  it("detects dependency and conflict blockers from prior validation layers", () => {
    const dependencyResolved = resolveDecisionRelationships({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: [node("node-a"), node("node-b")],
      relationship_hints: [hint("node-a", "node-b", "depends_on")],
    });
    const dependencyValidation = validateDecisionDependencies({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: dependencyResolved.updated_nodes.map((item) => item.node_id === "node-b" ? node("node-b", { state: "REGISTERED" }) : item),
      relationships: dependencyResolved.relationships,
      lineage: dependencyResolved.lineage,
    });
    const conflictResolved = resolveDecisionRelationships({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: [node("node-a"), node("node-b")],
      relationship_hints: [hint("node-a", "node-b", "conflicts_with")],
    });
    const conflictDetection = detectDecisionConflicts({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: conflictResolved.updated_nodes,
      relationships: conflictResolved.relationships,
      lineage: conflictResolved.lineage,
    });
    const result = detectDecisionBlockers({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: conflictDetection.updated_nodes,
      dependency_validation: dependencyValidation,
      conflict_detection: conflictDetection,
    });

    expect(result.detection_status).toBe("PASS");
    expect(result.blockers.map((item) => item.blocker_type)).toEqual(expect.arrayContaining(["DEPENDENCY_BLOCKER", "CONFLICT_BLOCKER"]));
    expect(result.reasonCodes).toContain("DEPENDENCY_UNRESOLVED_DETECTED");
    expect(result.reasonCodes).toContain("CONFLICT_UNRESOLVED_DETECTED");
  });

  it("detects explicit replay, evidence, mission, recovery, certification, governance, and authority blockers", () => {
    const nodes = [node("node-a"), node("node-b"), node("node-c")];
    const result = detectDecisionBlockers({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes,
      blocker_signals: [
        signal("node-a", "REPLAY_BLOCKER"),
        signal("node-a", "EVIDENCE_BLOCKER"),
        signal("node-b", "MISSION_BLOCKER"),
        signal("node-b", "RECOVERY_BLOCKER"),
        signal("node-c", "CERTIFICATION_BLOCKER"),
        signal("node-c", "GOVERNANCE_BLOCKER"),
        signal("node-a", "AUTHORITY_BLOCKER"),
      ],
    });

    expect(result.detection_status).toBe("PASS");
    expect(result.blockers.map((item) => item.blocker_type).sort()).toEqual([
      "AUTHORITY_BLOCKER",
      "CERTIFICATION_BLOCKER",
      "EVIDENCE_BLOCKER",
      "GOVERNANCE_BLOCKER",
      "MISSION_BLOCKER",
      "RECOVERY_BLOCKER",
      "REPLAY_BLOCKER",
    ]);
    expect(result.reasonCodes).toContain("REPLAY_REFERENCE_UNAVAILABLE_DETECTED");
    expect(result.reasonCodes).toContain("CERTIFICATION_NOT_PASSED_DETECTED");
    expect(result.reasonCodes).toContain("RECOVERY_PLAN_MISSING_DETECTED");
    expect(result.reasonCodes).toContain("OPERATOR_APPROVAL_PENDING_DETECTED");
  });

  it("fails closed on hidden blockers, governance/replay omissions, authority gaps, tenant leakage, constitutional violations, integrity mismatch, and replay mismatch", () => {
    const nodes = [node("node-a"), node("node-b")];
    const hidden = detectDecisionBlockers({ graph_id: "graph-alpha", tenant_id: "tenant-alpha", mission_id: "mission-alpha", nodes, blocker_signals: [signal("node-a", "GOVERNANCE_BLOCKER", { hidden: true })] });
    const noGovernance = detectDecisionBlockers({ graph_id: "graph-alpha", tenant_id: "tenant-alpha", mission_id: "mission-alpha", nodes, blocker_signals: [signal("node-a", "GOVERNANCE_BLOCKER", { governance_refs: [] })] });
    const noReplay = detectDecisionBlockers({ graph_id: "graph-alpha", tenant_id: "tenant-alpha", mission_id: "mission-alpha", nodes, blocker_signals: [signal("node-a", "REPLAY_BLOCKER", { replay_refs: [] })] });
    const noAuthority = detectDecisionBlockers({ graph_id: "graph-alpha", tenant_id: "tenant-alpha", mission_id: "mission-alpha", nodes, blocker_signals: [signal("node-a", "AUTHORITY_BLOCKER", { authority_refs: [] })] });
    const crossTenant = detectDecisionBlockers({ graph_id: "graph-alpha", tenant_id: "tenant-alpha", mission_id: "mission-alpha", nodes: [node("node-a", { tenant_id: "tenant-beta" })], blocker_signals: [signal("node-a", "GOVERNANCE_BLOCKER")] });
    const constitutional = detectDecisionBlockers({ graph_id: "graph-alpha", tenant_id: "tenant-alpha", mission_id: "mission-alpha", nodes, blocker_signals: [signal("node-a", "GOVERNANCE_BLOCKER", { constitutional_violation: true })] });
    const resolved = resolvedRequirements();
    const integrityMismatch = detectDecisionBlockers({
      graph_id: "graph-alpha",
      tenant_id: "tenant-alpha",
      mission_id: "mission-alpha",
      nodes: resolved.updated_nodes,
      relationships: [{ ...resolved.relationships[0], relationship_basis: ["tampered"] }],
    });
    const base = detectDecisionBlockers({ graph_id: "graph-alpha", tenant_id: "tenant-alpha", mission_id: "mission-alpha", nodes, blocker_signals: [signal("node-a", "GOVERNANCE_BLOCKER")] });
    const replayMismatch = detectDecisionBlockers({ graph_id: "graph-alpha", tenant_id: "tenant-alpha", mission_id: "mission-alpha", nodes, blocker_signals: [signal("node-a", "GOVERNANCE_BLOCKER")], replay_expected_hash: `${base.replay_hash}-wrong` });

    expect(hidden.reasonCodes).toContain("HIDDEN_BLOCKER_DISCOVERED");
    expect(noGovernance.reasonCodes).toContain("GOVERNANCE_REFERENCES_MISSING");
    expect(noReplay.reasonCodes).toContain("REPLAY_REFERENCES_MISSING");
    expect(noAuthority.reasonCodes).toContain("AUTHORITY_VALIDATION_INCOMPLETE");
    expect(crossTenant.reasonCodes).toContain("TENANT_ISOLATION_VIOLATED");
    expect(crossTenant.reasonCodes).toContain("CROSS_TENANT_BLOCKER_LEAKAGE_PREVENTED");
    expect(constitutional.reasonCodes).toContain("CONSTITUTIONAL_VIOLATION_DETECTED");
    expect(integrityMismatch.reasonCodes).toContain("INTEGRITY_MISMATCH_DETECTED");
    expect(replayMismatch.reasonCodes).toContain("REPLAY_MISMATCH_DETECTED");
  });
});
