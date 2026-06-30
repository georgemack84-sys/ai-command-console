import { describe, expect, it } from "vitest";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import {
  canonicalizeTruthReplayDeterminismGate,
  createDefaultTruthReplayContractFixture,
  decideTruthReplayDeterminismGate,
  reconstructTruthReplayInputBundle,
  reconstructTruthReplayStatePackage,
  toTruthReplayDeterminismGateStorageRecord,
  TRUTH_REPLAY_DETERMINISM_GATE_EVENTS,
  verifyTruthReplayOutput,
} from "@/services/mission-control";
import type {
  TruthReplayDeterminismGateRequest,
  TruthReplayOutputVerification,
} from "@/services/mission-control";

function payload() {
  return { recommendation_id: "rec_001", advisory_only: true, risk_state: "LOW", confidence_value: 0.82 };
}

function outputHash(value = payload()) {
  return hashConfidenceValue("mission-control-replay-output-canonical-payload-hash", canonicalizeConfidenceToString(value));
}

function matchedVerification(overrides: Partial<TruthReplayOutputVerification> = {}): TruthReplayOutputVerification {
  const contract = createDefaultTruthReplayContractFixture({ lifecycle_state: "VALIDATED", certification_state: "CONTRACT_VALIDATED" });
  const bundle = reconstructTruthReplayInputBundle({
    bundle_id: "bundle_001",
    replay_contract: contract,
    tenant_id: "tenant_alpha",
    mission_id: "mission_truth_001",
    truth_records: [
      { truth_record_id: "truth_001", tenant_id: "tenant_alpha", mission_id: "mission_truth_001", record_type: "RECOMMENDATION", payload: payload(), record_hash: "truth_hash_001", expected_hash: "truth_hash_001" },
      { truth_record_id: "truth_002", tenant_id: "tenant_alpha", mission_id: "mission_truth_001", record_type: "RISK", payload: { risk_state: "LOW" }, record_hash: "truth_hash_002", expected_hash: "truth_hash_002" },
    ],
    events: [{ event_id: "event_001", tenant_id: "tenant_alpha", mission_id: "mission_truth_001", event_type: "RECOMMENDATION_CREATED", event_timestamp: "2026-06-24T00:00:00.000Z", ledger_sequence: 1, payload: {}, event_hash: "event_hash_001", expected_hash: "event_hash_001" }],
    evidence_inputs: [{ evidence_ref: "evidence_001", tenant_id: "tenant_alpha", payload_metadata: {}, evidence_hash: "evidence_hash_001", expected_hash: "evidence_hash_001", relationship_preserved: true }],
    lineage_inputs: [{ lineage_ref: "lineage_001", tenant_id: "tenant_alpha", lineage_type: "PARENT_CHILD", lineage_hash: "lineage_hash_001", expected_hash: "lineage_hash_001", causal_chain_preserved: true }],
    governance_inputs: [
      { governance_ref: "policy_snapshot_001", tenant_id: "tenant_alpha", governance_type: "POLICY_SNAPSHOT", governance_hash: "governance_hash_001", expected_hash: "governance_hash_001", original_context_preserved: true },
      { governance_ref: "gov_decision_001", tenant_id: "tenant_alpha", governance_type: "GOVERNANCE_DECISION", governance_hash: "gov_hash_001", expected_hash: "gov_hash_001", original_context_preserved: true },
    ],
    authority_inputs: [{ authority_ref: "authority_operator_001", tenant_id: "tenant_alpha", requester_id: "operator_001", execution_authority: "NONE", authority_expansion_allowed: false, authority_hash: "authority_hash_001", expected_hash: "authority_hash_001" }],
    schema_inputs: [{ schema_ref: "schema_replay_output_v1", schema_type: "REPLAY_OUTPUT", schema_version: "v1", schema_hash: "schema_hash_001", expected_hash: "schema_hash_001", supported: true }],
    created_at: "2026-06-24T00:00:00.000Z",
  });
  const state = reconstructTruthReplayStatePackage({
    state_package_id: "state_package_001",
    input_bundle: bundle,
    replay_state_boundary: { boundary_type: "AT_TARGET", target_id: "rec_001", include_prior_state: true, include_target_state: true, include_following_state: false, boundary_hash: "boundary_hash_001" },
    created_at: "2026-06-24T00:00:00.000Z",
  });
  const verification = verifyTruthReplayOutput({
    verification_id: "verification_001",
    state_package: state,
    produced_output: {
      replay_output_id: "output_001",
      replay_id: state.replay_id,
      tenant_id: state.tenant_id,
      mission_id: state.mission_id,
      output_type: "RECOMMENDATION_OUTPUT",
      output_payload: payload(),
      produced_from_contract_hash: state.replay_contract_hash,
      produced_from_input_bundle_hash: state.input_bundle_hash,
      produced_from_state_package_hash: state.state_hashes.full_state_package_hash,
      evidence_refs: ["evidence_001"],
      lineage_refs: ["lineage_001"],
      governance_refs: ["policy_snapshot_001", "gov_decision_001"],
      authority_refs: ["authority_operator_001"],
      output_schema_version: "replay_output/v1",
      output_hash: outputHash(),
      advisory_only: true,
      execution_authority: "NONE",
      created_at: "2026-06-24T00:00:00.000Z",
    },
    expected_output: {
      expected_output_id: "expected_001",
      expected_output_type: "RECOMMENDATION_OUTPUT",
      expected_payload: payload(),
      expected_output_hash: outputHash(),
      expected_schema_version: "replay_output/v1",
      expected_evidence_refs: ["evidence_001"],
      expected_lineage_refs: ["lineage_001"],
      expected_governance_refs: ["policy_snapshot_001", "gov_decision_001"],
      expected_authority_refs: ["authority_operator_001"],
      mismatch_policy: "FAIL",
    },
    verification_scope: { tenant_id: state.tenant_id, mission_id: state.mission_id, allowed_output_types: ["RECOMMENDATION_OUTPUT"], verify_hash: true, verify_structure: true, verify_fields: true, verify_evidence_refs: true, verify_lineage_refs: true, verify_governance_refs: true, verify_authority: true, verify_redaction: true, allow_metadata_differences: false },
    comparison_context: { comparison_mode: "FULL_CONTEXT", equality_requirement: "EXACT_HASH_MATCH", fail_on_unexpected_fields: true, fail_on_missing_fields: true, fail_on_type_mismatch: true, fail_on_schema_mismatch: true },
    created_at: "2026-06-24T00:00:00.000Z",
  });
  return { ...verification, ...overrides };
}

function request(overrides: Partial<TruthReplayDeterminismGateRequest> = {}): TruthReplayDeterminismGateRequest {
  const verification = matchedVerification();
  return {
    gate_id: "gate_001",
    output_verification: verification,
    gate_scope: {
      tenant_id: verification.tenant_id,
      mission_id: verification.mission_id,
      replay_type: "RECOMMENDATION_REPLAY",
      replay_target_type: "RECOMMENDATION",
      replay_target_ids: ["rec_001"],
      required_artifacts: ["REPLAY_CONTRACT", "INPUT_BUNDLE", "STATE_PACKAGE", "OUTPUT_VERIFICATION", "REPLAY_OUTPUT", "EXPECTED_OUTPUT"],
      require_contract_certified: true,
      require_input_bundle_certified: true,
      require_state_package_certified: true,
      require_output_verification_certified: true,
      require_governance_preserved: true,
      require_authority_preserved: true,
      require_evidence_preserved: true,
      require_lineage_preserved: true,
      fail_on_unresolved_escalation: true,
    },
    created_at: "2026-06-24T00:00:00.000Z",
    ...overrides,
  };
}

function gate(overrides: Partial<TruthReplayDeterminismGateRequest> = {}) {
  return decideTruthReplayDeterminismGate(request(overrides));
}

function expectState(overrides: Partial<TruthReplayDeterminismGateRequest>, state: string) {
  const result = gate(overrides);
  expect(result.final_state).toBe(state);
  return result;
}

describe("replayDeterminismGate", () => {
  it("determinism gate contract present -> PASS", () => expect(gate().gate_id).toBe("gate_001"));
  it("determinism gate contract missing -> INVALID", () => expectState({ force_gate_contract_missing: true }, "INVALID"));
  it("gate_id present -> PASS", () => expect(gate().gate_id).toBeTruthy());
  it("gate_id missing -> INVALID", () => expectState({ gate_id: "" }, "INVALID"));
  it("replay_id present -> PASS", () => expect(gate().replay_id).toBe("replay_001"));
  it("replay_id missing -> INVALID", () => expectState({ force_replay_id_missing: true }, "INVALID"));
  it("tenant_id present -> PASS", () => expect(gate().tenant_id).toBe("tenant_alpha"));
  it("tenant_id missing -> INVALID", () => expectState({ force_tenant_id_missing: true }, "INVALID"));
  it("valid gate state accepted -> PASS", () => expect(gate().final_state).toBe("REPRODUCED"));
  it("invalid gate state rejected -> INVALID", () => expectState({ force_invalid_gate_state: true }, "INVALID"));
  it("replay contract loaded -> PASS", () => expect(gate().artifact_status.replay_contract_present).toBe(true));
  it("replay contract missing -> INCOMPLETE", () => expectState({ force_replay_contract_missing: true }, "INCOMPLETE"));
  it("replay contract invalid -> INVALID", () => expectState({ force_replay_contract_invalid: true }, "INVALID"));
  it("input bundle loaded -> PASS", () => expect(gate().artifact_status.input_bundle_present).toBe(true));
  it("input bundle missing -> INCOMPLETE", () => expectState({ force_input_bundle_missing: true }, "INCOMPLETE"));
  it("input bundle uncertified -> INCOMPLETE", () => expectState({ force_input_bundle_uncertified: true }, "INCOMPLETE"));
  it("state package loaded -> PASS", () => expect(gate().artifact_status.state_package_present).toBe(true));
  it("state package missing -> INCOMPLETE", () => expectState({ force_state_package_missing: true }, "INCOMPLETE"));
  it("state package uncertified -> INCOMPLETE", () => expectState({ force_state_package_uncertified: true }, "INCOMPLETE"));
  it("output verification loaded -> PASS", () => expect(gate().artifact_status.output_verification_present).toBe(true));
  it("output verification missing -> INCOMPLETE", () => expectState({ force_output_verification_missing: true }, "INCOMPLETE"));
  it("output verification uncertified -> INCOMPLETE", () => expectState({ force_output_verification_uncertified: true }, "INCOMPLETE"));
  it("replay output present -> PASS", () => expect(gate().artifact_status.replay_output_present).toBe(true));
  it("replay output missing -> INCOMPLETE", () => expectState({ force_replay_output_missing: true }, "INCOMPLETE"));
  it("expected output present -> PASS", () => expect(gate().artifact_status.expected_output_present).toBe(true));
  it("expected output missing -> INCOMPLETE", () => expectState({ force_expected_output_missing: true }, "INCOMPLETE"));
  it("contract hash valid -> PASS", () => expect(gate().hash_status.contract_hash_valid).toBe(true));
  it("contract hash mismatch -> INVALID", () => expectState({ force_contract_hash_mismatch: true }, "INVALID"));
  it("input bundle hash mismatch -> INVALID", () => expectState({ force_input_bundle_hash_mismatch: true }, "INVALID"));
  it("state package hash mismatch -> INVALID", () => expectState({ force_state_package_hash_mismatch: true }, "INVALID"));
  it("output verification hash mismatch -> INVALID", () => expectState({ force_output_verification_hash_mismatch: true }, "INVALID"));
  it("hash chain consistent -> PASS", () => expect(gate().hash_status.hash_chain_consistent).toBe(true));
  it("hash chain broken -> INVALID", () => expectState({ force_hash_chain_broken: true }, "INVALID"));
  it("artifact provenance mismatch -> INVALID", () => expectState({ force_artifact_provenance_mismatch: true }, "INVALID"));
  it("tenant scope preserved -> PASS", () => expect(gate().gate_scope.tenant_id).toBe("tenant_alpha"));
  it("tenant scope violation -> INVALID", () => expectState({ force_tenant_scope_violation: true }, "INVALID"));
  it("mission scope violation -> INVALID", () => expectState({ force_mission_scope_violation: true }, "INVALID"));
  it("replay target scope valid -> PASS", () => expect(gate().gate_scope.replay_target_ids).toContain("rec_001"));
  it("replay target mismatch -> INVALID", () => expectState({ force_replay_target_mismatch: true }, "INVALID"));
  it("completeness verified -> PASS", () => expect(gate().completeness_status.complete).toBe(true));
  it("missing evidence -> INCOMPLETE", () => expectState({ force_missing_evidence: true }, "INCOMPLETE"));
  it("missing lineage -> INCOMPLETE", () => expectState({ force_missing_lineage: true }, "INCOMPLETE"));
  it("missing governance context -> INCOMPLETE", () => expectState({ force_missing_governance: true }, "INCOMPLETE"));
  it("missing schema context -> INCOMPLETE", () => expectState({ force_missing_schema: true }, "INCOMPLETE"));
  it("stable serialization verified -> PASS", () => expect(gate().determinism_status.stable_serialization_verified).toBe(true));
  it("unstable serialization detected -> INVALID", () => expectState({ force_unstable_serialization: true }, "INVALID"));
  it("stable ordering verified -> PASS", () => expect(gate().determinism_status.stable_ordering_verified).toBe(true));
  it("non-deterministic ordering detected -> INVALID", () => expectState({ force_nondeterministic_ordering: true }, "INVALID"));
  it("unsupported hash algorithm -> INVALID", () => expectState({ force_unsupported_hash_algorithm: true }, "INVALID"));
  it("wall-clock dependency detected -> INVALID", () => expectState({ force_wall_clock_dependency: true }, "INVALID"));
  it("random dependency detected -> INVALID", () => expectState({ force_random_dependency: true }, "INVALID"));
  it("external network dependency detected -> INVALID", () => expectState({ force_external_network_dependency: true }, "INVALID"));
  it("uncontrolled tool dependency detected -> INVALID", () => expectState({ force_uncontrolled_tool_dependency: true }, "INVALID"));
  it("governance preserved -> PASS", () => expect(gate().governance_status.preserved).toBe(true));
  it("policy snapshot missing -> INCOMPLETE", () => expectState({ force_policy_snapshot_missing: true }, "INCOMPLETE"));
  it("current policy substitution detected -> INVALID", () => expectState({ force_current_policy_substitution: true }, "INVALID"));
  it("governance bypass detected -> INVALID", () => expectState({ force_governance_bypass: true }, "INVALID"));
  it("governance decision mismatch -> INVALID", () => expectState({ force_governance_decision_mismatch: true }, "INVALID"));
  it("authority preserved -> PASS", () => expect(gate().authority_status.preserved).toBe(true));
  it("execution authority absent -> PASS", () => expect(gate().executionAuthorized).toBe(false));
  it("execution authority detected -> INVALID", () => expectState({ force_execution_authority: true }, "INVALID"));
  it("authority expansion detected -> INVALID", () => expectState({ force_authority_expansion: true }, "INVALID"));
  it("source mutation attempted -> INVALID", () => expectState({ force_source_mutation: true }, "INVALID"));
  it("unauthorized write attempted -> INVALID", () => expectState({ force_unauthorized_write: true }, "INVALID"));
  it("evidence preserved -> PASS", () => expect(gate().evidence_status.preserved).toBe(true));
  it("evidence ref mismatch -> MISMATCH", () => expectState({ force_evidence_ref_mismatch: true }, "MISMATCH"));
  it("evidence hash mismatch -> INVALID", () => expectState({ force_evidence_hash_mismatch: true }, "INVALID"));
  it("lineage preserved -> PASS", () => expect(gate().lineage_status.preserved).toBe(true));
  it("lineage ref mismatch -> MISMATCH", () => expectState({ force_lineage_ref_mismatch: true }, "MISMATCH"));
  it("cross-tenant lineage edge -> INVALID", () => expectState({ force_cross_tenant_lineage_edge: true }, "INVALID"));
  it("output verification MATCHED -> REPRODUCED candidate", () => expect(gate().output_status.output_matched).toBe(true));
  it("output verification MISMATCHED -> MISMATCH", () => expectState({ output_verification: matchedVerification({ verification_result: { ...matchedVerification().verification_result, result_state: "MISMATCHED", matched: false, mismatched: true, certification_eligible: false } }) }, "MISMATCH"));
  it("output verification UNVERIFIABLE -> INCOMPLETE", () => expectState({ force_unverifiable_output: true }, "INCOMPLETE"));
  it("output verification ESCALATION_REQUIRED -> INCOMPLETE", () => expectState({ output_verification: matchedVerification({ verification_result: { ...matchedVerification().verification_result, result_state: "ESCALATION_REQUIRED", matched: false, certification_eligible: false } }) }, "INCOMPLETE"));
  it("output verification FAILED due to missing expected output -> INCOMPLETE", () => expectState({ force_output_failed_missing_expected: true }, "INCOMPLETE"));
  it("output verification FAILED due to hard violation -> INVALID", () => expectState({ force_output_failed_hard_violation: true }, "INVALID"));
  it("all checks pass -> REPRODUCED", () => expectState({}, "REPRODUCED"));
  it("one mismatch and no invalid/incomplete -> MISMATCH", () => expectState({ force_lineage_ref_mismatch: true }, "MISMATCH"));
  it("one incomplete and no invalid -> INCOMPLETE", () => expectState({ force_missing_schema: true }, "INCOMPLETE"));
  it("one invalid -> INVALID", () => expectState({ force_hash_chain_broken: true }, "INVALID"));
  it("invalid plus mismatch -> INVALID", () => expectState({ force_hash_chain_broken: true, force_lineage_ref_mismatch: true }, "INVALID"));
  it("incomplete plus mismatch -> INCOMPLETE", () => expectState({ force_missing_schema: true, force_lineage_ref_mismatch: true }, "INCOMPLETE"));
  it("REPRODUCED with mismatch report -> INVALID", () => expectState({ force_reproduced_with_mismatch_report: true }, "INVALID"));
  it("REPRODUCED with missing artifact -> INVALID", () => expectState({ force_reproduced_with_missing_artifact: true }, "INVALID"));
  it("MISMATCH without mismatch summary -> INVALID", () => expectState({ force_mismatch_without_summary: true }, "INVALID"));
  it("INCOMPLETE without missing item summary -> INVALID", () => expectState({ force_incomplete_without_summary: true }, "INVALID"));
  it("INVALID without invalidity reason -> INVALID", () => expectState({ force_invalid_without_reason: true }, "INVALID"));
  it("gate decision report generated -> PASS", () => expect(gate().decision_reason).toContain("reproduced"));
  it("gate hash generated -> PASS", () => expect(gate().gate_hash).toBeTruthy());
  it("same gate inputs produce same gate hash -> PASS", () => expect(gate().gate_hash).toBe(gate().gate_hash));
  it("changed final state changes gate hash -> PASS", () => expect(gate().gate_hash).not.toBe(gate({ force_missing_schema: true }).gate_hash));
  it("changed decision factor changes gate hash -> PASS", () => expect(gate().gate_hash).not.toBe(gate({ decision_factor_nonce: "nonce" }).gate_hash));
  it("determinism gate audit event emitted -> PASS", () => expect(gate().audit_events).toContain(TRUTH_REPLAY_DETERMINISM_GATE_EVENTS.REPLAY_DETERMINISM_GATE_DECISION_RECORDED));
  it("canonical gate serialization is stable", () => expect(canonicalizeTruthReplayDeterminismGate(gate())).toBe(canonicalizeTruthReplayDeterminismGate(gate())));
  it("storage record stores final state and hash", () => {
    const storage = toTruthReplayDeterminismGateStorageRecord(gate());
    expect(storage.final_state).toBe("REPRODUCED");
    expect(storage.gate_hash).toBeTruthy();
  });
});
