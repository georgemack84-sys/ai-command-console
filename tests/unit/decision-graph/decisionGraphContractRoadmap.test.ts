import { describe, expect, it } from "vitest";
import {
  buildDecisionGraphRoadmapInput,
  CANONICAL_DECISION_RELATIONSHIP_TYPES,
  computeDecisionGraphNodeIntegrityHash,
  computeDecisionGraphRelationshipIntegrityHash,
  createDecisionGraphIntegrityHash,
  validateDecisionGraphRoadmapContract,
  type DecisionGraphRoadmapNodeInput,
  type DecisionGraphRoadmapRelationshipInput,
} from "@/services/decision-graph";

function node(
  nodeId: string,
  overrides: Partial<DecisionGraphRoadmapNodeInput> = {},
): DecisionGraphRoadmapNodeInput {
  const base = {
    node_id: nodeId,
    decision_candidate_id: `candidate-${nodeId}`,
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    decision_type: "RECOMMENDATION",
    priority: 10,
    state: "REGISTERED",
    previous_state: "CREATED",
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
    created_at: "2026-07-03T00:00:00.000Z",
    updated_at: "2026-07-03T00:00:00.000Z",
    ...overrides,
  } satisfies DecisionGraphRoadmapNodeInput;

  return Object.freeze({
    ...base,
    integrity_hash: overrides.integrity_hash ?? computeDecisionGraphNodeIntegrityHash(base),
  } satisfies DecisionGraphRoadmapNodeInput);
}

function relationship(
  relationshipId: string,
  sourceNodeId: string,
  targetNodeId: string,
  overrides: Partial<DecisionGraphRoadmapRelationshipInput> = {},
): DecisionGraphRoadmapRelationshipInput {
  const base = {
    relationship_id: relationshipId,
    graph_id: "graph-alpha",
    tenant_id: "tenant-alpha",
    mission_id: "mission-alpha",
    source_node_id: sourceNodeId,
    target_node_id: targetNodeId,
    relationship_type: "depends_on",
    governance_refs: [`governance-${relationshipId}`],
    replay_refs: [`replay-${relationshipId}`],
    ...overrides,
  } satisfies DecisionGraphRoadmapRelationshipInput;

  return Object.freeze({
    ...base,
    integrity_hash: overrides.integrity_hash ?? computeDecisionGraphRelationshipIntegrityHash(base),
  } satisfies DecisionGraphRoadmapRelationshipInput);
}

function roadmap(
  overrides: {
    nodes?: readonly DecisionGraphRoadmapNodeInput[];
    relationships?: readonly DecisionGraphRoadmapRelationshipInput[];
  } = {},
) {
  const nodes = overrides.nodes ?? [node("node-a"), node("node-b")];
  const relationships = overrides.relationships ?? [relationship("relationship-a", "node-a", "node-b")];

  return buildDecisionGraphRoadmapInput("tenant-alpha", "mission-alpha", "graph-alpha", nodes, relationships);
}

describe("decisionGraphContractRoadmap", () => {
  it("certifies the canonical graph contract, registry, hashes, and replay contract", () => {
    const validation = validateDecisionGraphRoadmapContract(roadmap());

    expect(validation.valid).toBe(true);
    expect(validation.certificationStatus).toBe("PASS");
    expect(validation.graph_contract_schema_defined).toBe(true);
    expect(validation.relationship_types_registered).toBe(true);
    expect(validation.graph_state_model_defined).toBe(true);
    expect(validation.node_integrity_hash_reproducible).toBe(true);
    expect(validation.graph_contract_replay_compatible).toBe(true);
    expect(validation.reasonCodes).toContain("GRAPH_CONTRACT_SCHEMA_DEFINED");
    expect(validation.reasonCodes).toContain("RELATIONSHIP_TYPES_REGISTERED");
    expect(validation.reasonCodes).toContain("GRAPH_CONTRACT_REPLAY_COMPATIBLE");
  });

  it("registers every required canonical relationship type", () => {
    const input = roadmap();

    expect(input.registry.allowed_relationship_types).toEqual(CANONICAL_DECISION_RELATIONSHIP_TYPES);
    expect(input.registry.governance_required_types).toEqual(CANONICAL_DECISION_RELATIONSHIP_TYPES);
    expect(input.registry.replay_required_types).toEqual(CANONICAL_DECISION_RELATIONSHIP_TYPES);
  });

  it("enforces required candidate, governance, replay, and integrity fields", () => {
    const missingCandidate = validateDecisionGraphRoadmapContract(roadmap({
      nodes: [node("node-a", { decision_candidate_id: "" }), node("node-b")],
    }));
    const missingGovernance = validateDecisionGraphRoadmapContract(roadmap({
      nodes: [node("node-a", { governance_refs: [] }), node("node-b")],
    }));
    const missingReplay = validateDecisionGraphRoadmapContract(roadmap({
      nodes: [node("node-a", { replay_refs: [] }), node("node-b")],
    }));
    const missingHash = validateDecisionGraphRoadmapContract(roadmap({
      nodes: [{ ...node("node-a"), integrity_hash: undefined }, node("node-b")],
    }));

    expect(missingCandidate.valid).toBe(false);
    expect(missingCandidate.reasonCodes).toContain("MISSING_CANDIDATE_LINK");
    expect(missingGovernance.valid).toBe(false);
    expect(missingGovernance.reasonCodes).toContain("GOVERNANCE_REFS_MISSING");
    expect(missingReplay.valid).toBe(false);
    expect(missingReplay.reasonCodes).toContain("REPLAY_REFS_MISSING");
    expect(missingHash.valid).toBe(false);
    expect(missingHash.reasonCodes).toContain("MISSING_INTEGRITY_HASH_REJECTED");
  });

  it("rejects unknown relationships, self-dependencies, cross-tenant links, and hidden relationships", () => {
    const unknown = validateDecisionGraphRoadmapContract(roadmap({
      relationships: [
        relationship("relationship-a", "node-a", "node-b", {
          relationship_type: "unknown_relationship_type" as DecisionGraphRoadmapRelationshipInput["relationship_type"],
        }),
      ],
    }));
    const self = validateDecisionGraphRoadmapContract(roadmap({
      relationships: [relationship("relationship-a", "node-a", "node-a")],
    }));
    const crossTenant = validateDecisionGraphRoadmapContract(roadmap({
      relationships: [relationship("relationship-a", "node-a", "node-b", { tenant_id: "tenant-beta" })],
    }));
    const hidden = validateDecisionGraphRoadmapContract(roadmap({
      relationships: [relationship("relationship-a", "node-a", "node-b", { hidden: true })],
    }));

    expect(unknown.valid).toBe(false);
    expect(unknown.reasonCodes).toContain("UNKNOWN_RELATIONSHIP_TYPE_REJECTED");
    expect(self.valid).toBe(false);
    expect(self.reasonCodes).toContain("SELF_DEPENDENCY_REJECTED");
    expect(crossTenant.valid).toBe(false);
    expect(crossTenant.reasonCodes).toContain("CROSS_TENANT_RELATIONSHIP_REJECTED");
    expect(hidden.valid).toBe(false);
    expect(hidden.reasonCodes).toContain("HIDDEN_RELATIONSHIP_REJECTED");
  });

  it("rejects invalid states, invalid transitions, hash mismatches, and replay divergence", () => {
    const invalidState = validateDecisionGraphRoadmapContract(roadmap({
      nodes: [node("node-a", { state: "INVALID" as DecisionGraphRoadmapNodeInput["state"] }), node("node-b")],
    }));
    const invalidTransition = validateDecisionGraphRoadmapContract(roadmap({
      nodes: [node("node-a", { previous_state: "ARCHIVED", state: "ORDERED" }), node("node-b")],
    }));
    const mismatch = validateDecisionGraphRoadmapContract(roadmap({
      nodes: [node("node-a", { integrity_hash: "tampered-hash" }), node("node-b")],
    }));
    const divergentInput = roadmap();
    const replayDivergence = validateDecisionGraphRoadmapContract({
      ...divergentInput,
      replay: {
        ...divergentInput.replay,
        expected_replay_hash: "different-replay-hash",
      },
    });

    expect(invalidState.valid).toBe(false);
    expect(invalidState.reasonCodes).toContain("INVALID_GRAPH_STATE_REJECTED");
    expect(invalidTransition.valid).toBe(false);
    expect(invalidTransition.reasonCodes).toContain("INVALID_STATE_TRANSITION_REJECTED");
    expect(mismatch.valid).toBe(false);
    expect(mismatch.reasonCodes).toContain("HASH_MISMATCH_DETECTED");
    expect(replayDivergence.valid).toBe(false);
    expect(replayDivergence.reasonCodes).toContain("REPLAY_DIVERGENCE_REJECTED");
  });

  it("creates reproducible integrity hash records", () => {
    const graphNode = node("node-a");
    const first = createDecisionGraphIntegrityHash(graphNode);
    const second = createDecisionGraphIntegrityHash(graphNode);

    expect(first).toEqual(second);
    expect(first.hash_algorithm).toBe("sha256");
    expect(first.hash_state).toBe("MATCHED");
  });
});
