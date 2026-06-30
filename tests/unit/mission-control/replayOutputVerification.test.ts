import { describe, expect, it } from "vitest";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import {
  createDefaultTruthReplayContractFixture,
  reconstructTruthReplayInputBundle,
  reconstructTruthReplayStatePackage,
  verifyTruthReplayOutput,
  canonicalizeTruthReplayOutputVerification,
  toTruthReplayOutputVerificationStorageRecord,
  TRUTH_REPLAY_OUTPUT_VERIFICATION_EVENTS,
} from "@/services/mission-control";
import type {
  TruthReplayExpectedOutput,
  TruthReplayOutputVerificationRequest,
  TruthReplayProducedOutput,
  TruthReplayStatePackage,
} from "@/services/mission-control";

function payload() {
  return {
    recommendation_id: "rec_001",
    advisory_only: true,
    risk_state: "LOW",
    confidence_value: 0.82,
    governance_decision: "ALLOW_ADVISORY",
  };
}

function outputHash(value = payload()) {
  return hashConfidenceValue("mission-control-replay-output-canonical-payload-hash", canonicalizeConfidenceToString(value));
}

function statePackage(overrides: Partial<TruthReplayStatePackage> = {}): TruthReplayStatePackage {
  const contract = createDefaultTruthReplayContractFixture({
    lifecycle_state: "VALIDATED",
    certification_state: "CONTRACT_VALIDATED",
  });
  const bundle = reconstructTruthReplayInputBundle({
    bundle_id: "bundle_001",
    replay_contract: contract,
    tenant_id: "tenant_alpha",
    mission_id: "mission_truth_001",
    truth_records: [{
      truth_record_id: "truth_001",
      tenant_id: "tenant_alpha",
      mission_id: "mission_truth_001",
      record_type: "RECOMMENDATION",
      payload: payload(),
      record_hash: "truth_hash_001",
      expected_hash: "truth_hash_001",
    }, {
      truth_record_id: "truth_002",
      tenant_id: "tenant_alpha",
      mission_id: "mission_truth_001",
      record_type: "RISK",
      payload: { risk_state: "LOW" },
      record_hash: "truth_hash_002",
      expected_hash: "truth_hash_002",
    }],
    events: [{
      event_id: "event_001",
      tenant_id: "tenant_alpha",
      mission_id: "mission_truth_001",
      event_type: "RECOMMENDATION_CREATED",
      event_timestamp: "2026-06-24T00:00:00.000Z",
      ledger_sequence: 1,
      payload: { event: "created" },
      event_hash: "event_hash_001",
      expected_hash: "event_hash_001",
    }],
    evidence_inputs: [{
      evidence_ref: "evidence_001",
      tenant_id: "tenant_alpha",
      payload_metadata: { source: "ledger" },
      evidence_hash: "evidence_hash_001",
      expected_hash: "evidence_hash_001",
      relationship_preserved: true,
    }],
    lineage_inputs: [{
      lineage_ref: "lineage_001",
      tenant_id: "tenant_alpha",
      lineage_type: "PARENT_CHILD",
      lineage_hash: "lineage_hash_001",
      expected_hash: "lineage_hash_001",
      causal_chain_preserved: true,
    }],
    governance_inputs: [{
      governance_ref: "policy_snapshot_001",
      tenant_id: "tenant_alpha",
      governance_type: "POLICY_SNAPSHOT",
      governance_hash: "governance_hash_001",
      expected_hash: "governance_hash_001",
      original_context_preserved: true,
    }, {
      governance_ref: "gov_decision_001",
      tenant_id: "tenant_alpha",
      governance_type: "GOVERNANCE_DECISION",
      governance_hash: "gov_hash_001",
      expected_hash: "gov_hash_001",
      original_context_preserved: true,
    }],
    authority_inputs: [{
      authority_ref: "authority_operator_001",
      tenant_id: "tenant_alpha",
      requester_id: "operator_001",
      execution_authority: "NONE",
      authority_expansion_allowed: false,
      authority_hash: "authority_hash_001",
      expected_hash: "authority_hash_001",
    }],
    schema_inputs: [{
      schema_ref: "schema_replay_output_v1",
      schema_type: "REPLAY_OUTPUT",
      schema_version: "v1",
      schema_hash: "schema_hash_001",
      expected_hash: "schema_hash_001",
      supported: true,
    }],
    created_at: "2026-06-24T00:00:00.000Z",
  });
  const state = reconstructTruthReplayStatePackage({
    state_package_id: "state_package_001",
    input_bundle: bundle,
    replay_state_boundary: {
      boundary_type: "AT_TARGET",
      target_id: "rec_001",
      include_prior_state: true,
      include_target_state: true,
      include_following_state: false,
      boundary_hash: "boundary_hash_001",
    },
    created_at: "2026-06-24T00:00:00.000Z",
  });
  return { ...state, ...overrides };
}

function producedOutput(overrides: Partial<TruthReplayProducedOutput> = {}): TruthReplayProducedOutput {
  const state = statePackage();
  return {
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
    risk_refs: ["risk_001"],
    confidence_refs: ["confidence_001"],
    output_schema_version: "replay_output/v1",
    output_hash: outputHash(),
    advisory_only: true,
    execution_authority: "NONE",
    created_at: "2026-06-24T00:00:00.000Z",
    ...overrides,
  };
}

function expectedOutput(overrides: Partial<TruthReplayExpectedOutput> = {}): TruthReplayExpectedOutput {
  return {
    expected_output_id: "expected_001",
    expected_output_ref: "truth_001",
    expected_output_type: "RECOMMENDATION_OUTPUT",
    expected_payload: payload(),
    expected_output_hash: outputHash(),
    expected_schema_version: "replay_output/v1",
    expected_governance_decision: "ALLOW_ADVISORY",
    expected_recommendation_id: "rec_001",
    expected_confidence_value: 0.82,
    expected_confidence_band: "HIGH",
    expected_risk_state: "LOW",
    expected_evidence_refs: ["evidence_001"],
    expected_lineage_refs: ["lineage_001"],
    expected_governance_refs: ["policy_snapshot_001", "gov_decision_001"],
    expected_authority_refs: ["authority_operator_001"],
    mismatch_policy: "FAIL",
    ...overrides,
  };
}

function request(overrides: Partial<TruthReplayOutputVerificationRequest> = {}): TruthReplayOutputVerificationRequest {
  const state = statePackage();
  return {
    verification_id: "verification_001",
    state_package: state,
    produced_output: producedOutput({
      replay_id: state.replay_id,
      tenant_id: state.tenant_id,
      mission_id: state.mission_id,
      produced_from_contract_hash: state.replay_contract_hash,
      produced_from_input_bundle_hash: state.input_bundle_hash,
      produced_from_state_package_hash: state.state_hashes.full_state_package_hash,
    }),
    expected_output: expectedOutput(),
    verification_scope: {
      tenant_id: state.tenant_id,
      mission_id: state.mission_id,
      allowed_output_types: ["RECOMMENDATION_OUTPUT"],
      restricted_fields: [],
      verify_hash: true,
      verify_structure: true,
      verify_fields: true,
      verify_evidence_refs: true,
      verify_lineage_refs: true,
      verify_governance_refs: true,
      verify_authority: true,
      verify_redaction: true,
      allow_metadata_differences: false,
    },
    comparison_context: {
      comparison_mode: "FULL_CONTEXT",
      equality_requirement: "EXACT_HASH_MATCH",
      fail_on_unexpected_fields: true,
      fail_on_missing_fields: true,
      fail_on_type_mismatch: true,
      fail_on_schema_mismatch: true,
    },
    created_at: "2026-06-24T00:00:00.000Z",
    ...overrides,
  };
}

function verification(overrides: Partial<TruthReplayOutputVerificationRequest> = {}) {
  return verifyTruthReplayOutput(request(overrides));
}

function expectFailure(overrides: Partial<TruthReplayOutputVerificationRequest>, code: string) {
  const result = verification(overrides);
  expect(result.verification_result.result_state).toBe("FAILED");
  expect(result.failure_reasons?.map((reason) => reason.code)).toContain(code);
  return result;
}

describe("replayOutputVerification", () => {
  it("output verification contract present -> PASS", () => {
    expect(verification().verification_id).toBe("verification_001");
  });

  it("verification_id missing -> FAIL", () => {
    expectFailure({ verification_id: "" }, "VERIFICATION_ID_MISSING");
  });

  it("replay_id present -> PASS", () => {
    expect(verification().replay_id).toBe("replay_001");
  });

  it("tenant_id present -> PASS", () => {
    expect(verification().tenant_id).toBe("tenant_alpha");
  });

  it("certified state package loaded -> PASS", () => {
    expect(verification().certification_state).toBe("OUTPUT_MATCHED");
  });

  it("state package hash valid -> PASS", () => {
    expect(verification().state_package_hash).toBeTruthy();
  });

  it("state package hash mismatch -> FAIL", () => {
    expectFailure({ force_state_package_hash_mismatch: true }, "STATE_PACKAGE_HASH_MISMATCH");
  });

  it("uncertified state package used -> FAIL", () => {
    expectFailure({ state_package: statePackage({ certification_state: "STATE_RECONSTRUCTION_FAILED" }) }, "STATE_PACKAGE_UNCERTIFIED");
  });

  it("unresolved state escalation present -> FAIL", () => {
    expectFailure({ state_package: statePackage({ reconstruction_state: "ESCALATED" }) }, "UNRESOLVED_STATE_ESCALATION_PRESENT");
  });

  it("replay output artifact loaded -> PASS", () => {
    expect(verification().replay_output_ref).toBe("output_001");
  });

  it("replay output artifact missing -> FAIL", () => {
    expectFailure({ produced_output: undefined as unknown as TruthReplayProducedOutput }, "REPLAY_OUTPUT_MISSING");
  });

  it("replay output hash valid -> PASS", () => {
    expect(verification().hash_verification.hash_match).toBe(true);
  });

  it("replay output hash mismatch -> FAIL", () => {
    expectFailure({ force_output_hash_mismatch: true }, "REPLAY_OUTPUT_HASH_MISMATCH");
  });

  it("replay output tenant mismatch -> FAIL", () => {
    expectFailure({ produced_output: producedOutput({ tenant_id: "tenant_beta" }) }, "REPLAY_OUTPUT_TENANT_MISMATCH");
  });

  it("replay output mission mismatch -> FAIL", () => {
    expectFailure({ produced_output: producedOutput({ mission_id: "mission_other" }) }, "REPLAY_OUTPUT_MISSION_MISMATCH");
  });

  it("replay output provenance valid -> PASS", () => {
    expect(verification().produced_output.produced_from_state_package_hash).toBe(verification().state_package_hash);
  });

  it("replay output provenance mismatch -> FAIL", () => {
    expectFailure({ force_provenance_mismatch: true }, "REPLAY_OUTPUT_PROVENANCE_MISMATCH");
  });

  it("expected output resolved -> PASS", () => {
    expect(verification().expected_output.expected_output_ref).toBe("truth_001");
  });

  it("expected output missing when required -> FAIL", () => {
    expectFailure({ expected_output: undefined as unknown as TruthReplayExpectedOutput }, "EXPECTED_OUTPUT_MISSING");
  });

  it("expected output hash missing when required -> FAIL", () => {
    expectFailure({ force_expected_hash_missing: true }, "EXPECTED_OUTPUT_HASH_MISSING");
  });

  it("output scope valid -> PASS", () => {
    expect(verification().verification_scope.allowed_output_types).toContain("RECOMMENDATION_OUTPUT");
  });

  it("unauthorized output type -> FAIL", () => {
    expectFailure({ verification_scope: { ...request().verification_scope, allowed_output_types: ["EVENT_SEQUENCE_OUTPUT"] } }, "OUTPUT_TYPE_UNAUTHORIZED");
  });

  it("restricted field exposed -> FAIL", () => {
    expectFailure({ verification_scope: { ...request().verification_scope, restricted_fields: ["recommendation_id"] } }, "RESTRICTED_FIELD_EXPOSED");
  });

  it("produced output canonicalized -> PASS", () => {
    expect(verification().canonicalization_context.canonicalization_hash).toBeTruthy();
  });

  it("same output canonicalizes identically -> PASS", () => {
    expect(canonicalizeTruthReplayOutputVerification(verification())).toBe(canonicalizeTruthReplayOutputVerification(verification()));
  });

  it("reordered object keys produce same hash -> PASS", () => {
    const reordered = producedOutput({ output_payload: { confidence_value: 0.82, risk_state: "LOW", advisory_only: true, governance_decision: "ALLOW_ADVISORY", recommendation_id: "rec_001" } });
    expect(verification().verification_hash).toBe(verification({ produced_output: reordered }).verification_hash);
  });

  it("unstable serialization detected -> FAIL", () => {
    expectFailure({ force_unstable_serialization: true }, "UNSTABLE_OUTPUT_SERIALIZATION_DETECTED");
  });

  it("wall-clock field in payload detected -> FAIL", () => {
    expectFailure({ force_wall_clock_field: true }, "WALL_CLOCK_OUTPUT_FIELD_DETECTED");
  });

  it("produced hash differs from expected hash -> MISMATCH", () => {
    const result = verification({ expected_output: expectedOutput({ expected_output_hash: "different_hash" }) });
    expect(result.verification_result.result_state).toBe("MISMATCHED");
    expect(result.mismatch_report.mismatch_categories).toContain("OUTPUT_HASH");
  });

  it("output type mismatch -> FAIL", () => {
    expectFailure({ force_output_type_mismatch: true }, "OUTPUT_TYPE_MISMATCH");
  });

  it("schema mismatch -> FAIL", () => {
    expectFailure({ force_schema_mismatch: true }, "OUTPUT_SCHEMA_MISMATCH");
  });

  it("required field missing -> FAIL", () => {
    expectFailure({ force_required_field_missing: true }, "REQUIRED_FIELD_MISSING");
  });

  it("unexpected field present -> FAIL", () => {
    expectFailure({ force_unexpected_field_present: true }, "UNEXPECTED_FIELD_PRESENT");
  });

  it("field value match -> PASS", () => {
    expect(verification().field_verification.fields_verified).toBe(true);
  });

  it("field value mismatch detected -> FAIL", () => {
    expectFailure({ force_field_value_mismatch: true }, "FIELD_VALUE_MISMATCH");
  });

  it("governance output preserved -> PASS", () => {
    expect(verification().governance_verification.verified).toBe(true);
  });

  it("policy snapshot changed -> FAIL", () => {
    expectFailure({ force_policy_snapshot_changed: true }, "POLICY_SNAPSHOT_CHANGED");
  });

  it("current policy substituted -> FAIL", () => {
    expectFailure({ force_current_policy_substituted: true }, "CURRENT_POLICY_SUBSTITUTED");
  });

  it("governance decision mismatch -> FAIL", () => {
    expectFailure({ force_governance_decision_mismatch: true }, "GOVERNANCE_DECISION_MISMATCH");
  });

  it("governance bypass detected -> FAIL", () => {
    expectFailure({ force_governance_bypass: true }, "GOVERNANCE_BYPASS_DETECTED");
  });

  it("authority output preserved -> PASS", () => {
    expect(verification().authority_verification.verified).toBe(true);
  });

  it("execution authority detected -> FAIL", () => {
    expectFailure({ force_execution_authority: true }, "EXECUTION_AUTHORITY_DETECTED");
  });

  it("source mutation attempted -> FAIL", () => {
    expectFailure({ force_source_mutation: true }, "SOURCE_MUTATION_ATTEMPTED");
  });

  it("authority expansion detected -> FAIL", () => {
    expectFailure({ force_authority_expansion: true }, "AUTHORITY_EXPANSION_DETECTED");
  });

  it("evidence refs match -> PASS", () => {
    expect(verification().evidence_verification.verified).toBe(true);
  });

  it("evidence ref missing -> FAIL", () => {
    expectFailure({ force_evidence_ref_missing: true }, "EVIDENCE_REF_MISSING");
  });

  it("unexpected evidence added -> ESCALATION_REQUIRED", () => {
    expect(verification({ force_unexpected_evidence_added: true }).verification_result.result_state).toBe("ESCALATION_REQUIRED");
  });

  it("lineage refs match -> PASS", () => {
    expect(verification().lineage_verification.verified).toBe(true);
  });

  it("lineage relationship missing -> FAIL", () => {
    expectFailure({ force_lineage_relationship_missing: true }, "LINEAGE_RELATIONSHIP_MISSING");
  });

  it("recommendation output matches -> PASS", () => {
    expect(verification().recommendation_verification?.verified).toBe(true);
  });

  it("recommendation payload mismatch -> MISMATCH", () => {
    expect(verification({ force_recommendation_payload_mismatch: true }).verification_result.result_state).toBe("ESCALATION_REQUIRED");
  });

  it("advisory-only state preserved -> PASS", () => {
    expect(verification().produced_output.advisory_only).toBe(true);
  });

  it("advisory-only state changed -> FAIL", () => {
    expectFailure({ force_advisory_only_changed: true }, "ADVISORY_ONLY_STATE_CHANGED");
  });

  it("risk output matches -> PASS", () => {
    expect(verification().risk_verification?.verified).toBe(true);
  });

  it("risk mismatch detected -> MISMATCH", () => {
    expect(verification({ force_risk_mismatch: true }).verification_result.result_state).toBe("ESCALATION_REQUIRED");
  });

  it("confidence output matches -> PASS", () => {
    expect(verification().confidence_verification?.verified).toBe(true);
  });

  it("confidence mismatch detected -> MISMATCH", () => {
    expect(verification({ force_confidence_mismatch: true }).verification_result.result_state).toBe("ESCALATION_REQUIRED");
  });

  it("redaction mismatch detected -> FAIL", () => {
    expectFailure({ force_redaction_mismatch: true }, "REDACTION_MISMATCH");
  });

  it("mismatch report generated -> PASS", () => {
    expect(verification().mismatch_report.mismatch_report_hash).toBeTruthy();
  });

  it("matched result generated -> PASS", () => {
    expect(verification().verification_result.result_state).toBe("MATCHED");
  });

  it("mismatched result generated -> PASS", () => {
    expect(verification({ expected_output: expectedOutput({ expected_output_hash: "different_hash" }) }).verification_result.result_state).toBe("MISMATCHED");
  });

  it("failed result generated -> PASS", () => {
    expect(expectFailure({ force_execution_authority: true }, "EXECUTION_AUTHORITY_DETECTED").verification_result.failed).toBe(true);
  });

  it("verification hash generated -> PASS", () => {
    expect(verification().verification_hash).toBeTruthy();
  });

  it("same verification produces same hash -> PASS", () => {
    expect(verification().verification_hash).toBe(verification().verification_hash);
  });

  it("changed output changes verification hash -> PASS", () => {
    const changedPayload = { ...payload(), risk_state: "HIGH" };
    expect(verification().verification_hash).not.toBe(verification({
      produced_output: producedOutput({ output_payload: changedPayload, output_hash: outputHash(changedPayload) }),
      expected_output: expectedOutput({ expected_payload: changedPayload, expected_output_hash: outputHash(changedPayload) }),
    }).verification_hash);
  });

  it("changed governance result changes verification hash -> PASS", () => {
    expect(verification().verification_hash).not.toBe(verification({ force_policy_snapshot_changed: true }).verification_hash);
  });

  it("changed authority result changes verification hash -> PASS", () => {
    expect(verification().verification_hash).not.toBe(verification({ force_authority_expansion: true }).verification_hash);
  });

  it("output verification audit event emitted -> PASS", () => {
    expect(verification().audit_events).toContain(TRUTH_REPLAY_OUTPUT_VERIFICATION_EVENTS.REPLAY_OUTPUT_VERIFICATION_REPORT_CREATED);
  });

  it("output verification failure recorded -> PASS", () => {
    expect(expectFailure({ force_execution_authority: true }, "EXECUTION_AUTHORITY_DETECTED").audit_events).toContain("REPLAY_OUTPUT_VERIFICATION_FAILED");
  });

  it("output verification escalation recorded -> PASS", () => {
    expect(verification({ force_escalation: true }).audit_events).toContain("REPLAY_OUTPUT_VERIFICATION_ESCALATED");
  });

  it("storage record captures verification hash", () => {
    const storage = toTruthReplayOutputVerificationStorageRecord(verification());
    expect(storage.verification_id).toBe("verification_001");
    expect(storage.verification_hash).toBeTruthy();
    expect(storage.produced_output_json).toContain("rec_001");
  });
});
