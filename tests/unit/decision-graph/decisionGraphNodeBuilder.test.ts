import { describe, expect, it } from "vitest";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import {
  buildDecisionGraphNodeFromCandidate,
  generateDecisionGraphNodeId,
  type DecisionGraphNodeRecord,
} from "@/services/decision-graph";
import type { DecisionCandidate } from "@/types/decision-input-normalization";

function validCandidate(overrides: Partial<DecisionCandidate> = {}): DecisionCandidate {
  const result = normalizeDecisionCandidateInput();
  if (!result.candidate) throw new Error("expected default candidate fixture to normalize");
  return Object.freeze({
    ...result.candidate,
    ...overrides,
  } satisfies DecisionCandidate);
}

function rehashCandidate(candidate: DecisionCandidate): DecisionCandidate {
  const hashable = { ...candidate };
  delete (hashable as Partial<DecisionCandidate>).integrity_hash;
  return Object.freeze({
    ...candidate,
    integrity_hash: generateDecisionIntegrityHash(hashable),
  });
}

describe("decisionGraphNodeBuilder", () => {
  it("maps a valid normalized decision candidate into one registered graph node", () => {
    const candidate = validCandidate();
    const result = buildDecisionGraphNodeFromCandidate({ candidate });

    expect(result.build_status).toBe("PASS");
    expect(result.certificationStatus).toBe("PASS");
    expect(result.node).toBeDefined();
    expect(result.node?.decision_candidate_id).toBe(candidate.candidate_id);
    expect(result.node?.decision_type).toBe("RECOMMENDATION");
    expect(result.node?.state).toBe("REGISTERED");
    expect(result.node?.dependency_refs).toEqual([]);
    expect(result.node?.conflict_refs).toEqual([]);
    expect(result.node?.blocker_refs).toEqual([]);
    expect(result.node?.supporting_refs).toEqual([]);
    expect(result.node?.governance_refs).toEqual(candidate.governance_refs);
    expect(result.node?.replay_refs).toEqual(candidate.replay_refs);
    expect(result.node?.source_candidate_hash).toBe(candidate.integrity_hash);
    expect(result.node_record.registration_status).toBe("REGISTERED");
    expect(result.node_record.created_from_candidate_ref).toBe(candidate.source_record_ref);
    expect(result.reasonCodes).toContain("NODE_REGISTERED");
  });

  it("generates deterministic node ids and distinct tenant-scoped identities", () => {
    const firstCandidate = validCandidate();
    const secondCandidate = validCandidate({ candidate_id: "candidate_other" });
    const crossTenantCandidate = validCandidate({ tenant_id: "tenant_beta" });

    expect(generateDecisionGraphNodeId(firstCandidate)).toBe(generateDecisionGraphNodeId(firstCandidate));
    expect(generateDecisionGraphNodeId(firstCandidate)).not.toBe(generateDecisionGraphNodeId(secondCandidate));
    expect(generateDecisionGraphNodeId(firstCandidate)).not.toBe(generateDecisionGraphNodeId(crossTenantCandidate));
    expect(buildDecisionGraphNodeFromCandidate({ candidate: firstCandidate })).toEqual(buildDecisionGraphNodeFromCandidate({ candidate: firstCandidate }));
  });

  it("assigns relationship-pending state only when explicitly queued", () => {
    const result = buildDecisionGraphNodeFromCandidate({
      candidate: validCandidate(),
      queue_relationship_resolution: true,
    });

    expect(result.build_status).toBe("PASS");
    expect(result.node?.state).toBe("RELATIONSHIPS_PENDING");
  });

  it("rejects incomplete candidates, missing governance refs, missing replay refs, and missing hashes", () => {
    const missingId = buildDecisionGraphNodeFromCandidate({ candidate: validCandidate({ candidate_id: "" }) });
    const missingGovernance = buildDecisionGraphNodeFromCandidate({ candidate: validCandidate({ governance_refs: [] }) });
    const missingReplay = buildDecisionGraphNodeFromCandidate({ candidate: validCandidate({ replay_refs: [] }) });
    const missingHash = buildDecisionGraphNodeFromCandidate({ candidate: validCandidate({ integrity_hash: "" }) });

    expect(missingId.build_status).toBe("FAIL");
    expect(missingId.reasonCodes).toContain("CANDIDATE_INCOMPLETE");
    expect(missingGovernance.build_status).toBe("FAIL");
    expect(missingGovernance.reasonCodes).toContain("MISSING_GOVERNANCE_REFS");
    expect(missingReplay.build_status).toBe("FAIL");
    expect(missingReplay.reasonCodes).toContain("MISSING_REPLAY_REFS");
    expect(missingHash.build_status).toBe("FAIL");
    expect(missingHash.reasonCodes).toContain("CANDIDATE_INCOMPLETE");
  });

  it("rejects candidate hash mismatches, tenant mismatches, mission mismatches, and advisory-only violations", () => {
    const candidate = validCandidate();
    const hashMismatch = buildDecisionGraphNodeFromCandidate({ candidate: { ...candidate, integrity_hash: "tampered" } });
    const tenantMismatch = buildDecisionGraphNodeFromCandidate({ candidate, tenant_id: "tenant_beta" });
    const missionMismatch = buildDecisionGraphNodeFromCandidate({ candidate, mission_id: "mission_beta" });
    const advisoryViolation = buildDecisionGraphNodeFromCandidate({ candidate: rehashCandidate({ ...candidate, advisory_only: false }) });

    expect(hashMismatch.build_status).toBe("FAIL");
    expect(hashMismatch.reasonCodes).toContain("CANDIDATE_HASH_MISMATCH");
    expect(tenantMismatch.build_status).toBe("FAIL");
    expect(tenantMismatch.reasonCodes).toContain("TENANT_MISMATCH");
    expect(missionMismatch.build_status).toBe("FAIL");
    expect(missionMismatch.reasonCodes).toContain("MISSION_MISMATCH");
    expect(advisoryViolation.build_status).toBe("FAIL");
    expect(advisoryViolation.reasonCodes).toContain("ADVISORY_ONLY_STATUS_VIOLATED");
  });

  it("blocks duplicate node ids and cross-tenant node collisions", () => {
    const candidate = validCandidate();
    const first = buildDecisionGraphNodeFromCandidate({ candidate });
    const duplicate = buildDecisionGraphNodeFromCandidate({
      candidate,
      existing_node_records: [first.node_record],
    });
    const crossTenantRecord: DecisionGraphNodeRecord = {
      ...first.node_record,
      tenant_id: "tenant_beta",
      registration_status: "REGISTERED",
    };
    const crossTenantCollision = buildDecisionGraphNodeFromCandidate({
      candidate,
      existing_node_records: [crossTenantRecord],
    });

    expect(duplicate.build_status).toBe("FAIL");
    expect(duplicate.reasonCodes).toContain("DUPLICATE_NODE_ID");
    expect(crossTenantCollision.build_status).toBe("FAIL");
    expect(crossTenantCollision.reasonCodes).toContain("CROSS_TENANT_NODE_COLLISION_BLOCKED");
  });

  it("reconstructs identical nodes during replay and rejects hidden or requested ids", () => {
    const candidate = validCandidate();
    const first = buildDecisionGraphNodeFromCandidate({ candidate });
    const replay = buildDecisionGraphNodeFromCandidate({ candidate });
    const hidden = buildDecisionGraphNodeFromCandidate({ candidate, hidden_runtime_context: { now: Date.now() } });
    const requested = buildDecisionGraphNodeFromCandidate({ candidate, requested_node_id: "node_random" });

    expect(first.node).toEqual(replay.node);
    expect(first.reasonCodes).toContain("REPLAY_RECONSTRUCTS_IDENTICAL_NODE");
    expect(hidden.build_status).toBe("FAIL");
    expect(hidden.reasonCodes).toContain("HIDDEN_RUNTIME_CONTEXT_REJECTED");
    expect(requested.build_status).toBe("FAIL");
    expect(requested.reasonCodes).toContain("RANDOM_NODE_ID_REJECTED");
  });
});
