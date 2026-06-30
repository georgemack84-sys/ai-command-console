import { describe, expect, it } from "vitest";
import {
  createDefaultTruthReplayContractFixture,
  hashTruthReplayContract,
  normalizeTruthReplayContract,
  toTruthReplayContractStorageRecord,
  TRUTH_REPLAY_CONTRACT_EVENTS,
  TRUTH_REPLAY_DOCTRINE,
  validateTruthReplayContract,
  validateTruthReplayLifecycleTransition,
} from "@/services/mission-control";
import type { TruthReplayContract, TruthReplayLifecycleState } from "@/services/mission-control";

function mutableContract(overrides: Partial<TruthReplayContract> = {}): TruthReplayContract {
  const base = JSON.parse(JSON.stringify(createDefaultTruthReplayContractFixture())) as TruthReplayContract;
  return {
    ...base,
    ...overrides,
    contract_hash: overrides.contract_hash,
  };
}

function expectValid(contract: TruthReplayContract = mutableContract()) {
  const result = validateTruthReplayContract(contract, "2026-06-24T00:00:00.000Z");

  expect(result.state).toBe("VALID");
  expect(result.errors).toEqual([]);
  expect(result.contract_hash).toBeTruthy();
  return result;
}

function expectInvalid(contract: unknown, code: string) {
  const result = validateTruthReplayContract(contract, "2026-06-24T00:00:00.000Z");

  expect(result.state).toBe("INVALID");
  expect(result.errors.map((error) => error.code)).toContain(code);
  return result;
}

describe("replayContract", () => {
  it("documents replay doctrine and event constants", () => {
    expect(TRUTH_REPLAY_DOCTRINE.reconstructionOnly).toBe(true);
    expect(TRUTH_REPLAY_DOCTRINE.executionAuthority).toBe("NONE");
    expect(TRUTH_REPLAY_DOCTRINE.sourceTruthMutationAllowed).toBe(false);
    expect(TRUTH_REPLAY_CONTRACT_EVENTS.REPLAY_CONTRACT_CREATED).toBe("REPLAY_CONTRACT_CREATED");
  });

  it("replay contract present -> PASS", () => {
    expectValid();
  });

  it("replay contract missing -> FAIL", () => {
    expectInvalid(undefined, "REPLAY_CONTRACT_MISSING");
  });

  it("replay_id present -> PASS", () => {
    expectValid(mutableContract({ replay_id: "replay_present" }));
  });

  it("replay_id missing -> FAIL", () => {
    expectInvalid(mutableContract({ replay_id: "" }), "REPLAY_ID_MISSING");
  });

  it("tenant_id present -> PASS", () => {
    expectValid(mutableContract({ tenant_id: "tenant_alpha" }));
  });

  it("tenant_id missing -> FAIL", () => {
    expectInvalid(mutableContract({ tenant_id: "" }), "TENANT_ID_MISSING");
  });

  it("replay type valid -> PASS", () => {
    expectValid(mutableContract({ replay_type: "RECOMMENDATION_REPLAY" }));
  });

  it("replay type invalid -> FAIL", () => {
    expectInvalid(mutableContract({ replay_type: "NOPE" as TruthReplayContract["replay_type"] }), "REPLAY_TYPE_INVALID");
  });

  it("replay target present -> PASS", () => {
    expectValid(mutableContract({
      replay_target: { target_type: "RECOMMENDATION", target_ids: ["rec_001"] },
    }));
  });

  it("replay target missing -> FAIL", () => {
    expectInvalid(mutableContract({ replay_target: undefined as unknown as TruthReplayContract["replay_target"] }), "REPLAY_TARGET_MISSING");
  });

  it("replay scope explicit -> PASS", () => {
    expectValid(mutableContract({
      replay_scope: {
        scope_type: "MISSION",
        allowed_record_types: ["RECOMMENDATION"],
        allowed_event_types: ["RECOMMENDATION_CREATED"],
        allowed_tenant_ids: ["tenant_alpha"],
        allowed_mission_ids: ["mission_truth_001"],
        redaction_required: false,
      },
    }));
  });

  it("replay scope missing -> FAIL", () => {
    expectInvalid(mutableContract({ replay_scope: undefined as unknown as TruthReplayContract["replay_scope"] }), "REPLAY_SCOPE_MISSING");
  });

  it("authorized tenant replay -> PASS", () => {
    expectValid(mutableContract({
      tenant_id: "tenant_alpha",
      replay_scope: {
        ...mutableContract().replay_scope,
        allowed_tenant_ids: ["tenant_alpha"],
      },
    }));
  });

  it("unauthorized cross-tenant replay -> FAIL", () => {
    expectInvalid(mutableContract({
      replay_scope: {
        ...mutableContract().replay_scope,
        allowed_tenant_ids: ["tenant_beta"],
      },
    }), "TENANT_SCOPE_VIOLATION");
  });

  it("source truth records present -> PASS", () => {
    expectValid(mutableContract({ source_truth_record_ids: ["truth_001"] }));
  });

  it("source truth records missing -> FAIL", () => {
    expectInvalid(mutableContract({ source_truth_record_ids: [] }), "SOURCE_TRUTH_RECORDS_MISSING");
  });

  it("evidence refs present when required -> PASS", () => {
    expectValid(mutableContract({ source_evidence_refs: ["evidence_001"] }));
  });

  it("evidence refs missing when required -> FAIL", () => {
    expectInvalid(mutableContract({ source_evidence_refs: [] }), "EVIDENCE_REQUIRED_MISSING");
  });

  it("lineage refs present when required -> PASS", () => {
    expectValid(mutableContract({ source_lineage_refs: ["lineage_001"] }));
  });

  it("lineage refs missing when required -> FAIL", () => {
    expectInvalid(mutableContract({ source_lineage_refs: [] }), "LINEAGE_REQUIRED_MISSING");
  });

  it("governance refs present when required -> PASS", () => {
    expectValid(mutableContract({ source_policy_refs: ["policy_snapshot_001"] }));
  });

  it("governance refs missing when required -> FAIL", () => {
    expectInvalid(mutableContract({ source_policy_refs: [] }), "GOVERNANCE_CONTEXT_REQUIRED_MISSING");
  });

  it("deterministic ordering present -> PASS", () => {
    expectValid(mutableContract({
      replay_ordering: { ordering_strategy: "LEDGER_SEQUENCE", tie_breaker: "TRUTH_RECORD_ID", require_total_order: true },
    }));
  });

  it("deterministic ordering missing -> FAIL", () => {
    expectInvalid(mutableContract({ replay_ordering: undefined as unknown as TruthReplayContract["replay_ordering"] }), "NON_DETERMINISTIC_ORDERING");
  });

  it("ambiguous ordering detected -> FAIL", () => {
    expectInvalid(mutableContract({
      replay_ordering: { ordering_strategy: "LEDGER_SEQUENCE", tie_breaker: "TRUTH_RECORD_ID", require_total_order: false },
    }), "NON_DETERMINISTIC_ORDERING");
  });

  it("input hash generated -> PASS", () => {
    const contract = mutableContract({
      input_integrity: {
        ...mutableContract().input_integrity,
        input_hash: undefined,
      },
    });
    const result = validateTruthReplayContract(contract);

    expect(result.state).toBe("VALID");
    expect(result.warnings.map((warning) => warning.code)).toContain("INPUT_HASH_MISSING");
    expect(result.normalized_contract?.input_integrity.input_hash).toBeTruthy();
  });

  it("input hash mismatch -> FAIL", () => {
    expectInvalid(mutableContract({
      input_integrity: {
        ...mutableContract().input_integrity,
        input_hash_mismatch_detected: true,
      },
    }), "INPUT_HASH_MISMATCH");
  });

  it("output hash expected-result shape valid -> PASS", () => {
    expectValid(mutableContract({
      expected_result: { expected_output_hash: "expected_hash_002", mismatch_policy: "FAIL" },
    }));
  });

  it("replay mismatch policy valid -> PASS", () => {
    expectValid(mutableContract({
      expected_result: { expected_output_hash: "expected_hash_002", mismatch_policy: "ESCALATE" },
    }));
  });

  it("replay mismatch policy invalid -> FAIL", () => {
    expectInvalid(mutableContract({
      expected_result: { expected_output_hash: "expected_hash_002", mismatch_policy: "BOUNCE" as "FAIL" },
    }), "MISMATCH_POLICY_INVALID");
  });

  it("wall-clock dependency allowed -> FAIL", () => {
    expectInvalid(mutableContract({
      deterministic_requirements: { ...mutableContract().deterministic_requirements, wall_clock_time_allowed: true },
    }), "WALL_CLOCK_DEPENDENCY_DETECTED");
  });

  it("random dependency allowed -> FAIL", () => {
    expectInvalid(mutableContract({
      deterministic_requirements: { ...mutableContract().deterministic_requirements, random_seed_allowed: true },
    }), "RANDOM_DEPENDENCY_DETECTED");
  });

  it("external network dependency allowed -> FAIL", () => {
    expectInvalid(mutableContract({
      deterministic_requirements: { ...mutableContract().deterministic_requirements, external_network_allowed: true },
    }), "NETWORK_DEPENDENCY_DETECTED");
  });

  it("uncontrolled tool dependency allowed -> FAIL", () => {
    expectInvalid(mutableContract({
      deterministic_requirements: { ...mutableContract().deterministic_requirements, uncontrolled_tool_use_allowed: true },
    }), "UNCONTROLLED_TOOL_USE_DETECTED");
  });

  it("execution authority none -> PASS", () => {
    expectValid(mutableContract({
      authority_context: { ...mutableContract().authority_context, execution_authority: "NONE" },
    }));
  });

  it("execution authority detected -> FAIL", () => {
    expectInvalid(mutableContract({
      authority_context: { ...mutableContract().authority_context, execution_authority: "TOOL" as "NONE" },
    }), "EXECUTION_AUTHORITY_DETECTED");
  });

  it("source mutation blocked -> PASS", () => {
    expectValid(mutableContract({
      output_policy: { ...mutableContract().output_policy, mutate_source_records: false },
    }));
  });

  it("source mutation attempted -> FAIL", () => {
    expectInvalid(mutableContract({
      output_policy: { ...mutableContract().output_policy, mutate_source_records: true },
    }), "SOURCE_MUTATION_ATTEMPTED");
  });

  it("replay audit policy valid -> PASS", () => {
    expectValid(mutableContract({ audit_policy: mutableContract().audit_policy }));
  });

  it("replay audit policy missing -> FAIL", () => {
    expectInvalid(mutableContract({ audit_policy: undefined as unknown as TruthReplayContract["audit_policy"] }), "AUDIT_POLICY_INVALID");
  });

  it("governance context preserved -> PASS", () => {
    expectValid(mutableContract({
      governance_context: {
        ...mutableContract().governance_context,
        policy_snapshot_id: "policy_snapshot_001",
      },
    }));
  });

  it("governance bypass detected -> FAIL", () => {
    expectInvalid(mutableContract({
      governance_context: {
        ...mutableContract().governance_context,
        governance_mismatch_detected: true,
      },
    }), "GOVERNANCE_BYPASS_DETECTED");
  });

  it("replay contract validated before execution -> PASS", () => {
    expectValid();
    expect(validateTruthReplayLifecycleTransition("REQUESTED", "VALIDATED").valid).toBe(true);
  });

  it("invalid contract rejected before execution -> PASS", () => {
    expectInvalid(mutableContract({ authority_context: { ...mutableContract().authority_context, read_authority_verified: false } }), "READ_AUTHORITY_UNVERIFIED");
    expect(validateTruthReplayLifecycleTransition("REQUESTED", "RUNNING").valid).toBe(false);
  });

  it("same contract produces same hash -> PASS", () => {
    const first = mutableContract();
    const second = mutableContract();

    expect(hashTruthReplayContract(first)).toBe(hashTruthReplayContract(second));
  });

  it("reordered object keys produce same hash -> PASS", () => {
    const first = mutableContract();
    const second = {
      ...first,
      governance_context: {
        fail_on_governance_mismatch: true,
        fail_on_policy_missing: true,
        enforce_original_policy_context: true,
        governance_decision_ids: ["gov_decision_001"],
        governance_ruleset_id: "governance_ruleset_001",
        constitution_version: "constitution_v1",
        policy_snapshot_id: "policy_snapshot_001",
      },
    };

    expect(hashTruthReplayContract(first)).toBe(hashTruthReplayContract(second));
  });

  it("changed governance context changes hash -> PASS", () => {
    const first = mutableContract();
    const second = mutableContract({
      governance_context: { ...mutableContract().governance_context, governance_ruleset_id: "governance_ruleset_002" },
    });

    expect(hashTruthReplayContract(first)).not.toBe(hashTruthReplayContract(second));
  });

  it("changed authority context changes hash -> PASS", () => {
    const first = mutableContract();
    const second = mutableContract({
      authority_context: { ...mutableContract().authority_context, authority_scope: ["READ_REPLAY"] },
    });

    expect(hashTruthReplayContract(first)).not.toBe(hashTruthReplayContract(second));
  });

  it("different source records change hash -> PASS", () => {
    const first = mutableContract();
    const second = mutableContract({ source_truth_record_ids: ["truth_003"] });

    expect(hashTruthReplayContract(first)).not.toBe(hashTruthReplayContract(second));
  });

  it("allowed lifecycle transition passes -> PASS", () => {
    expect(validateTruthReplayLifecycleTransition("READY", "RUNNING").valid).toBe(true);
  });

  it("disallowed lifecycle transition fails -> PASS", () => {
    expect(validateTruthReplayLifecycleTransition("COMPLETED", "RUNNING").valid).toBe(false);
  });

  it("FAILED -> CERTIFIED transition fails -> PASS", () => {
    expect(validateTruthReplayLifecycleTransition("FAILED", "CERTIFIED").valid).toBe(false);
  });

  it("REJECTED -> RUNNING transition fails -> PASS", () => {
    expect(validateTruthReplayLifecycleTransition("REJECTED", "RUNNING").valid).toBe(false);
  });

  it("ARCHIVED -> RUNNING transition fails -> PASS", () => {
    expect(validateTruthReplayLifecycleTransition("ARCHIVED", "RUNNING").valid).toBe(false);
  });

  it("partial replay without escalation fails -> PASS", () => {
    expectInvalid(mutableContract({
      failure_policy: {
        ...mutableContract().failure_policy,
        allow_partial_replay: true,
        partial_replay_requires_escalation: false,
      },
    }), "PARTIAL_REPLAY_REQUIRES_ESCALATION");
  });

  it("partial replay with escalation returns ESCALATION_REQUIRED -> PASS", () => {
    const result = validateTruthReplayContract(mutableContract({
      failure_policy: {
        ...mutableContract().failure_policy,
        allow_partial_replay: true,
        partial_replay_requires_escalation: true,
      },
    }));

    expect(result.state).toBe("ESCALATION_REQUIRED");
    expect(result.escalation_reasons.map((reason) => reason.code)).toContain("PARTIAL_REPLAY_REQUIRES_ESCALATION");
  });

  it("target type must be compatible with replay type", () => {
    expectInvalid(mutableContract({
      replay_type: "EVENT_REPLAY",
      replay_target: { target_type: "RECOMMENDATION", target_ids: ["rec_001"] },
    }), "REPLAY_TYPE_TARGET_INCOMPATIBLE");
  });

  it("contract hash mismatch fails closed", () => {
    expectInvalid({ ...normalizeTruthReplayContract(mutableContract()), contract_hash: "wrong_hash" }, "CONTRACT_HASH_MISMATCH");
  });

  it("storage representation preserves canonical JSON fields", () => {
    const storage = toTruthReplayContractStorageRecord(mutableContract());

    expect(storage.replay_id).toBe("replay_001");
    expect(storage.replay_scope_json).toContain("allowed_tenant_ids");
    expect(storage.contract_hash).toBeTruthy();
  });

  it("certification state invalid -> FAIL", () => {
    expectInvalid(mutableContract({ certification_state: "BOGUS" as TruthReplayContract["certification_state"] }), "CERTIFICATION_STATE_INVALID");
  });

  it.each<[TruthReplayLifecycleState, TruthReplayLifecycleState]>([
    ["REQUESTED", "VALIDATED"],
    ["REQUESTED", "REJECTED"],
    ["VALIDATED", "READY"],
    ["RUNNING", "COMPLETED"],
    ["RUNNING", "MISMATCH"],
    ["RUNNING", "FAILED"],
    ["MISMATCH", "ESCALATED"],
    ["COMPLETED", "CERTIFIED"],
    ["CERTIFIED", "ARCHIVED"],
  ])("allows lifecycle transition %s -> %s", (fromState, toState) => {
    expect(validateTruthReplayLifecycleTransition(fromState, toState).valid).toBe(true);
  });
});
