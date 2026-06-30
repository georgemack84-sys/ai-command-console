import { describe, expect, it } from "vitest";
import {
  canonicalizeTruthReplayStatePackage,
  createDefaultTruthReplayContractFixture,
  reconstructTruthReplayInputBundle,
  reconstructTruthReplayStatePackage,
  toTruthReplayStatePackageStorageRecord,
  TRUTH_REPLAY_STATE_RECONSTRUCTION_EVENTS,
  validateTruthReplayStateReconstructionTransition,
} from "@/services/mission-control";
import type {
  ReconstructedTruthRecord,
  TruthReplayInputBundle,
  TruthReplayStateBoundary,
  TruthReplayStateReconstructionRequest,
  TruthReplayStateReconstructionState,
} from "@/services/mission-control";

function contract() {
  return createDefaultTruthReplayContractFixture({
    lifecycle_state: "VALIDATED",
    certification_state: "CONTRACT_VALIDATED",
  });
}

function truthRecord(overrides: Partial<ReconstructedTruthRecord> = {}): ReconstructedTruthRecord {
  return {
    truth_record_id: "truth_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_truth_001",
    record_type: "RECOMMENDATION",
    payload: { recommendation_id: "rec_001" },
    record_hash: "truth_hash_001",
    expected_hash: "truth_hash_001",
    lifecycle_state: "ACTIVE",
    ...overrides,
  };
}

function inputBundle(overrides: Partial<TruthReplayInputBundle> = {}): TruthReplayInputBundle {
  const bundle = reconstructTruthReplayInputBundle({
    bundle_id: "bundle_001",
    replay_contract: contract(),
    tenant_id: "tenant_alpha",
    mission_id: "mission_truth_001",
    truth_records: [
      truthRecord(),
      truthRecord({ truth_record_id: "truth_002", record_type: "RISK", record_hash: "truth_hash_002", expected_hash: "truth_hash_002" }),
    ],
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
      supersession_preserved: true,
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
      schema_ref: "schema_replay_contract_v1",
      schema_type: "REPLAY_CONTRACT",
      schema_version: "v1",
      schema_hash: "schema_hash_001",
      expected_hash: "schema_hash_001",
      supported: true,
    }],
    created_at: "2026-06-24T00:00:00.000Z",
  });
  return { ...bundle, ...overrides };
}

function boundary(overrides: Partial<TruthReplayStateBoundary> = {}): TruthReplayStateBoundary {
  return {
    boundary_type: "AT_TARGET",
    target_id: "rec_001",
    include_prior_state: true,
    include_target_state: true,
    include_following_state: false,
    boundary_hash: "boundary_hash_001",
    ...overrides,
  };
}

function request(overrides: Partial<TruthReplayStateReconstructionRequest> = {}): TruthReplayStateReconstructionRequest {
  return {
    state_package_id: "state_package_001",
    input_bundle: inputBundle(),
    replay_state_boundary: boundary(),
    created_at: "2026-06-24T00:00:00.000Z",
    ...overrides,
  };
}

function statePackage(overrides: Partial<TruthReplayStateReconstructionRequest> = {}) {
  return reconstructTruthReplayStatePackage(request(overrides));
}

function expectFailure(overrides: Partial<TruthReplayStateReconstructionRequest>, code: string) {
  const result = statePackage(overrides);
  expect(result.reconstruction_state).toBe("FAILED");
  expect(result.failure_reasons?.map((reason) => reason.code)).toContain(code);
  return result;
}

describe("replayStateReconstruction", () => {
  it("certified input bundle loaded -> PASS", () => {
    const result = statePackage();

    expect(result.reconstruction_state).toBe("STATE_PACKAGE_CREATED");
    expect(result.certification_state).toBe("STATE_PACKAGE_CERTIFIED");
  });

  it("input bundle missing -> FAIL", () => {
    expectFailure({ input_bundle: undefined as unknown as TruthReplayInputBundle }, "INPUT_BUNDLE_MISSING");
  });

  it("input bundle hash valid -> PASS", () => {
    expect(statePackage().input_bundle_hash).toBeTruthy();
  });

  it("input bundle hash mismatch -> FAIL", () => {
    expectFailure({ force_input_bundle_hash_mismatch: true }, "INPUT_BUNDLE_HASH_MISMATCH");
  });

  it("uncertified input bundle used -> FAIL", () => {
    expectFailure({ input_bundle: inputBundle({ certification_state: "RECONSTRUCTION_FAILED" }) }, "INPUT_BUNDLE_UNCERTIFIED");
  });

  it("incomplete input bundle used -> FAIL", () => {
    expectFailure({ input_bundle: inputBundle({ completeness_report: { ...inputBundle().completeness_report, complete: false } }) }, "INPUT_BUNDLE_INCOMPLETE");
  });

  it("unresolved escalation present -> FAIL", () => {
    expectFailure({ input_bundle: inputBundle({ reconstruction_state: "ESCALATED" }) }, "UNRESOLVED_ESCALATION_PRESENT");
  });

  it("state boundary resolved -> PASS", () => {
    expect(statePackage().replay_state_boundary.boundary_hash).toBe("boundary_hash_001");
  });

  it("state boundary missing -> FAIL", () => {
    expectFailure({ replay_state_boundary: undefined as unknown as TruthReplayStateBoundary }, "STATE_BOUNDARY_MISSING");
  });

  it("ambiguous state boundary -> FAIL", () => {
    expectFailure({ replay_state_boundary: boundary({ target_event_id: "event_001" }) }, "STATE_BOUNDARY_AMBIGUOUS");
  });

  it("boundary outside tenant scope -> FAIL", () => {
    expectFailure({ force_boundary_tenant_violation: true }, "BOUNDARY_TENANT_SCOPE_VIOLATION");
  });

  it("boundary outside mission scope -> FAIL", () => {
    expectFailure({ force_boundary_mission_violation: true }, "BOUNDARY_MISSION_SCOPE_VIOLATION");
  });

  it("truth state reconstructed -> PASS", () => {
    expect(statePackage().truth_state.source_refs).toContain("truth_001");
  });

  it("required truth state missing -> FAIL", () => {
    expectFailure({ force_missing_truth_state: true }, "TRUTH_STATE_MISSING");
  });

  it("truth lifecycle valid -> PASS", () => {
    expect(statePackage().truth_state.integrity_state).toBe("VERIFIED");
  });

  it("invalid truth lifecycle detected -> FAIL", () => {
    expectFailure({ force_invalid_truth_lifecycle: true }, "INVALID_TRUTH_LIFECYCLE");
  });

  it("event timeline reconstructed -> PASS", () => {
    expect(statePackage().state_timeline.checkpoints.length).toBeGreaterThan(0);
  });

  it("event order deterministic -> PASS", () => {
    expect(statePackage().state_timeline.total_order_verified).toBe(true);
  });

  it("ambiguous event order -> FAIL", () => {
    expectFailure({ force_ambiguous_event_order: true }, "EVENT_ORDER_AMBIGUOUS");
  });

  it("event sequence gap detected -> FAIL", () => {
    expectFailure({ force_event_sequence_gap: true }, "EVENT_SEQUENCE_GAP");
  });

  it("evidence state reconstructed -> PASS", () => {
    expect(statePackage().evidence_state.source_refs).toContain("evidence_001");
  });

  it("evidence state missing when required -> FAIL", () => {
    expectFailure({ force_missing_evidence_state: true }, "EVIDENCE_STATE_MISSING");
  });

  it("evidence relationship preserved -> PASS", () => {
    expect(statePackage().state_invariants.evidence_lineage_preserved).toBe(true);
  });

  it("evidence relationship broken -> FAIL", () => {
    expectFailure({ force_evidence_relationship_broken: true }, "EVIDENCE_RELATIONSHIP_BROKEN");
  });

  it("lineage graph state reconstructed -> PASS", () => {
    expect(statePackage().lineage_state.source_refs).toContain("lineage_001");
  });

  it("parent relationship preserved -> PASS", () => {
    expect(statePackage().lineage_state.integrity_state).toBe("VERIFIED");
  });

  it("causal relationship preserved -> PASS", () => {
    expect(statePackage().lineage_state.reconstructed_value).toBeTruthy();
  });

  it("dependency relationship preserved -> PASS", () => {
    expect(statePackage().state_graph.graph_complete).toBe(true);
  });

  it("supersession chain preserved -> PASS", () => {
    expect(statePackage().lineage_state.source_refs).toContain("lineage_001");
  });

  it("broken lineage detected -> FAIL", () => {
    expectFailure({ force_broken_lineage: true }, "BROKEN_LINEAGE_DETECTED");
  });

  it("governance state reconstructed -> PASS", () => {
    expect(statePackage().governance_state.source_refs).toContain("policy_snapshot_001");
  });

  it("policy snapshot preserved -> PASS", () => {
    expect(statePackage().state_invariants.historical_policy_context_preserved).toBe(true);
  });

  it("policy snapshot missing -> FAIL", () => {
    expectFailure({ force_policy_snapshot_missing: true }, "POLICY_SNAPSHOT_MISSING");
  });

  it("current policy substituted for original policy -> FAIL", () => {
    expectFailure({ force_current_policy_substituted: true }, "CURRENT_POLICY_SUBSTITUTED");
  });

  it("governance decision missing -> FAIL", () => {
    expectFailure({ force_governance_decision_missing: true }, "GOVERNANCE_DECISION_MISSING");
  });

  it("authority state reconstructed -> PASS", () => {
    expect(statePackage().authority_state.source_refs).toContain("authority_operator_001");
  });

  it("execution authority remains NONE -> PASS", () => {
    expect(statePackage().executionAuthorized).toBe(false);
  });

  it("execution authority detected -> FAIL", () => {
    expectFailure({ force_execution_authority: true }, "EXECUTION_AUTHORITY_DETECTED");
  });

  it("authority expansion attempted -> FAIL", () => {
    expectFailure({ force_authority_expansion: true }, "AUTHORITY_EXPANSION_DETECTED");
  });

  it("recommendation state reconstructed -> PASS", () => {
    expect(statePackage().recommendation_state?.reconstructed_value).toEqual({ advisory_only: true, recomputed: false });
  });

  it("recommendation recomputation attempted -> FAIL", () => {
    expectFailure({ force_recommendation_recomputation: true }, "RECOMMENDATION_RECOMPUTATION_ATTEMPTED");
  });

  it("risk state reconstructed -> PASS", () => {
    expect(statePackage().risk_state?.component_hash).toBeTruthy();
  });

  it("confidence state reconstructed -> PASS", () => {
    expect(statePackage().confidence_state?.component_hash).toBeTruthy();
  });

  it("risk recomputation attempted -> FAIL", () => {
    expectFailure({ force_risk_recomputation: true }, "RISK_RECOMPUTATION_ATTEMPTED");
  });

  it("confidence recomputation attempted -> FAIL", () => {
    expectFailure({ force_confidence_recomputation: true }, "CONFIDENCE_RECOMPUTATION_ATTEMPTED");
  });

  it("runtime state reconstructed -> PASS", () => {
    expect(statePackage().runtime_state?.reconstructed_value).toEqual({ execution_authority: "NONE" });
  });

  it("unauthorized runtime state detected -> FAIL", () => {
    expectFailure({ force_unauthorized_runtime_state: true }, "UNAUTHORIZED_RUNTIME_STATE");
  });

  it("mission state reconstructed -> PASS", () => {
    expect(statePackage().mission_state?.source_refs).toContain("mission_truth_001");
  });

  it("mission scope violation -> FAIL", () => {
    expectFailure({ force_boundary_mission_violation: true }, "MISSION_SCOPE_VIOLATION");
  });

  it("operator state reconstructed -> PASS", () => {
    expect(statePackage().operator_state?.reconstructed_value).toEqual({ operator_authority_preserved: true });
  });

  it("required operator approval missing -> FAIL", () => {
    expectFailure({ force_operator_approval_missing: true }, "OPERATOR_APPROVAL_MISSING");
  });

  it("escalation chain preserved -> PASS", () => {
    expect(statePackage().escalation_state?.component_hash).toBeTruthy();
  });

  it("state transition log created -> PASS", () => {
    expect(statePackage().state_transition_log.transition_log_hash).toBeTruthy();
  });

  it("invalid state transition detected -> FAIL", () => {
    expectFailure({ force_invalid_state_transition: true }, "INVALID_STATE_TRANSITION");
  });

  it("state graph created -> PASS", () => {
    expect(statePackage().state_graph.state_graph_hash).toBeTruthy();
  });

  it("required graph node missing -> FAIL", () => {
    expectFailure({ force_graph_node_missing: true }, "STATE_GRAPH_NODE_MISSING");
  });

  it("required graph edge missing -> FAIL", () => {
    expectFailure({ force_graph_edge_missing: true }, "STATE_GRAPH_EDGE_MISSING");
  });

  it("cross-tenant state edge detected -> FAIL", () => {
    expectFailure({ force_cross_tenant_state_edge: true }, "CROSS_TENANT_STATE_EDGE_DETECTED");
  });

  it("state invariants verified -> PASS", () => {
    expect(statePackage().state_invariants.invariants_verified).toBe(true);
  });

  it("tenant invariant violation -> FAIL", () => {
    expectFailure({ force_tenant_invariant_violation: true }, "TENANT_INVARIANT_VIOLATION");
  });

  it("governance invariant violation -> FAIL", () => {
    expectFailure({ force_governance_invariant_violation: true }, "GOVERNANCE_INVARIANT_VIOLATION");
  });

  it("authority invariant violation -> FAIL", () => {
    expectFailure({ force_authority_invariant_violation: true }, "AUTHORITY_INVARIANT_VIOLATION");
  });

  it("historical policy invariant violation -> FAIL", () => {
    expectFailure({ force_historical_policy_invariant_violation: true }, "HISTORICAL_POLICY_INVARIANT_VIOLATION");
  });

  it("state consistency verified -> PASS", () => {
    expect(statePackage().state_consistency_report.consistent).toBe(true);
  });

  it("truth/event mismatch detected -> FAIL", () => {
    expectFailure({ force_truth_event_mismatch: true }, "TRUTH_EVENT_MISMATCH");
  });

  it("evidence/recommendation mismatch detected -> FAIL", () => {
    expectFailure({ force_evidence_recommendation_mismatch: true }, "EVIDENCE_RECOMMENDATION_MISMATCH");
  });

  it("governance/policy mismatch detected -> FAIL", () => {
    expectFailure({ force_governance_policy_mismatch: true }, "GOVERNANCE_POLICY_MISMATCH");
  });

  it("authority/requester mismatch detected -> FAIL", () => {
    expectFailure({ force_authority_requester_mismatch: true }, "AUTHORITY_REQUESTER_MISMATCH");
  });

  it("schema/source mismatch detected -> FAIL", () => {
    expectFailure({ force_schema_source_mismatch: true }, "SCHEMA_SOURCE_MISMATCH");
  });

  it("canonical state serialization stable -> PASS", () => {
    expect(canonicalizeTruthReplayStatePackage(statePackage())).toBe(canonicalizeTruthReplayStatePackage(statePackage()));
  });

  it("unstable state serialization detected -> FAIL", () => {
    expectFailure({ force_unstable_state_serialization: true }, "UNSTABLE_STATE_SERIALIZATION_DETECTED");
  });

  it("same state produces same hash -> PASS", () => {
    expect(statePackage().state_hashes.full_state_package_hash).toBe(statePackage().state_hashes.full_state_package_hash);
  });

  it("reordered object keys produce same hash -> PASS", () => {
    const first = statePackage();
    const second = reconstructTruthReplayStatePackage({
      created_at: "2026-06-24T00:00:00.000Z",
      replay_state_boundary: {
        boundary_hash: "boundary_hash_001",
        include_following_state: false,
        include_target_state: true,
        include_prior_state: true,
        target_id: "rec_001",
        boundary_type: "AT_TARGET",
      },
      input_bundle: inputBundle(),
      state_package_id: "state_package_001",
    });

    expect(first.state_hashes.full_state_package_hash).toBe(second.state_hashes.full_state_package_hash);
  });

  it("changed evidence state changes hash -> PASS", () => {
    const changed = inputBundle({ evidence_inputs: [{ ...inputBundle().evidence_inputs[0], evidence_hash: "changed_hash" }] });
    expect(statePackage().state_hashes.full_state_package_hash).not.toBe(statePackage({ input_bundle: changed }).state_hashes.full_state_package_hash);
  });

  it("changed lineage state changes hash -> PASS", () => {
    const changed = inputBundle({ lineage_inputs: [{ ...inputBundle().lineage_inputs[0], lineage_hash: "changed_hash" }] });
    expect(statePackage().state_hashes.full_state_package_hash).not.toBe(statePackage({ input_bundle: changed }).state_hashes.full_state_package_hash);
  });

  it("changed governance state changes hash -> PASS", () => {
    const changed = inputBundle({ governance_inputs: [{ ...inputBundle().governance_inputs[0], governance_hash: "changed_hash" }, inputBundle().governance_inputs[1]] });
    expect(statePackage().state_hashes.full_state_package_hash).not.toBe(statePackage({ input_bundle: changed }).state_hashes.full_state_package_hash);
  });

  it("changed authority state changes hash -> PASS", () => {
    const changed = inputBundle({ authority_inputs: [{ ...inputBundle().authority_inputs[0], authority_hash: "changed_hash" }] });
    expect(statePackage().state_hashes.full_state_package_hash).not.toBe(statePackage({ input_bundle: changed }).state_hashes.full_state_package_hash);
  });

  it("full state package hash generated -> PASS", () => {
    expect(statePackage().state_hashes.full_state_package_hash).toBeTruthy();
  });

  it("state package created -> PASS", () => {
    expect(statePackage().state_package_id).toBe("state_package_001");
  });

  it("incomplete state package certified -> FAIL", () => {
    expect(statePackage({ force_missing_truth_state: true }).certification_state).toBe("STATE_RECONSTRUCTION_FAILED");
  });

  it("uncertified state package sent to execution -> FAIL", () => {
    const result = statePackage({ force_missing_truth_state: true });

    expect(result.executionAuthorized).toBe(false);
    expect(result.certification_state).not.toBe("STATE_PACKAGE_CERTIFIED");
  });

  it("partial state without escalation -> FAIL", () => {
    expectFailure({ force_partial_state: true }, "PARTIAL_STATE_REQUIRES_ESCALATION");
  });

  it("partial state with escalation -> ESCALATION_REQUIRED", () => {
    const escalatedBundle = inputBundle({
      reconstruction_state: "ESCALATED",
      completeness_report: { ...inputBundle().completeness_report, escalation_required: true },
    });
    const result = statePackage({ input_bundle: escalatedBundle, force_partial_state: true });

    expect(result.reconstruction_state).toBe("ESCALATED");
    expect(result.escalation_reasons?.map((reason) => reason.code)).toContain("PARTIAL_STATE_REQUIRES_ESCALATION");
  });

  it("state reconstruction audit event emitted -> PASS", () => {
    expect(statePackage().audit_events).toContain(TRUTH_REPLAY_STATE_RECONSTRUCTION_EVENTS.REPLAY_STATE_PACKAGE_CREATED);
  });

  it("state reconstruction failure recorded -> PASS", () => {
    expect(expectFailure({ force_missing_truth_state: true }, "TRUTH_STATE_MISSING").audit_events).toContain("REPLAY_STATE_RECONSTRUCTION_FAILED");
  });

  it("storage record captures state package hash", () => {
    const storage = toTruthReplayStatePackageStorageRecord(statePackage());

    expect(storage.state_package_id).toBe("state_package_001");
    expect(storage.full_state_package_hash).toBeTruthy();
    expect(storage.truth_state_json).toContain("truth_001");
  });

  it.each<[TruthReplayStateReconstructionState, TruthReplayStateReconstructionState]>([
    ["REQUESTED", "INPUT_BUNDLE_LOADED"],
    ["INPUT_BUNDLE_LOADED", "BOUNDARY_RESOLVED"],
    ["BOUNDARY_RESOLVED", "COMPONENT_STATES_BUILT"],
    ["COMPONENT_STATES_BUILT", "TIMELINE_RECONSTRUCTED"],
    ["TIMELINE_RECONSTRUCTED", "TRANSITIONS_RECONSTRUCTED"],
    ["TRANSITIONS_RECONSTRUCTED", "STATE_GRAPH_RECONSTRUCTED"],
    ["STATE_GRAPH_RECONSTRUCTED", "INVARIANTS_VERIFIED"],
    ["INVARIANTS_VERIFIED", "CONSISTENCY_VERIFIED"],
    ["CONSISTENCY_VERIFIED", "STATE_HASHED"],
    ["STATE_HASHED", "STATE_PACKAGE_CREATED"],
    ["STATE_PACKAGE_CREATED", "ARCHIVED"],
  ])("allows state reconstruction transition %s -> %s", (fromState, toState) => {
    expect(validateTruthReplayStateReconstructionTransition(fromState, toState).valid).toBe(true);
  });

  it("blocks failed to package transition", () => {
    expect(validateTruthReplayStateReconstructionTransition("FAILED", "STATE_PACKAGE_CREATED").valid).toBe(false);
  });

  it("blocks archived to hashed transition", () => {
    expect(validateTruthReplayStateReconstructionTransition("ARCHIVED", "STATE_HASHED").valid).toBe(false);
  });
});
