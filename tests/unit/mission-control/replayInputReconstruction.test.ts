import { describe, expect, it } from "vitest";
import {
  canonicalizeTruthReplayInputBundle,
  createDefaultTruthReplayContractFixture,
  reconstructTruthReplayInputBundle,
  toTruthReplayInputBundleStorageRecord,
  TRUTH_REPLAY_INPUT_RECONSTRUCTION_EVENTS,
  validateTruthReplayInputReconstructionTransition,
} from "@/services/mission-control";
import type {
  ReconstructedEvent,
  ReconstructedEvidenceInput,
  ReconstructedGovernanceInput,
  ReconstructedLineageInput,
  ReconstructedTruthRecord,
  TruthReplayInputReconstructionRequest,
  TruthReplayInputReconstructionState,
  TruthReplaySchemaInput,
} from "@/services/mission-control";

function validContract(overrides = {}) {
  return createDefaultTruthReplayContractFixture({
    lifecycle_state: "VALIDATED",
    certification_state: "CONTRACT_VALIDATED",
    ...overrides,
  });
}

function truthRecord(overrides: Partial<ReconstructedTruthRecord> = {}): ReconstructedTruthRecord {
  return {
    truth_record_id: "truth_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_truth_001",
    record_type: "RECOMMENDATION",
    payload: { value: "recommendation-source" },
    record_hash: "truth_hash_001",
    expected_hash: "truth_hash_001",
    lifecycle_state: "ACTIVE",
    ...overrides,
  };
}

function event(overrides: Partial<ReconstructedEvent> = {}): ReconstructedEvent {
  return {
    event_id: "event_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_truth_001",
    event_type: "RECOMMENDATION_CREATED",
    event_timestamp: "2026-06-24T00:00:00.000Z",
    ledger_sequence: 1,
    payload: { event: "created" },
    event_hash: "event_hash_001",
    expected_hash: "event_hash_001",
    ...overrides,
  };
}

function evidence(overrides: Partial<ReconstructedEvidenceInput> = {}): ReconstructedEvidenceInput {
  return {
    evidence_ref: "evidence_001",
    tenant_id: "tenant_alpha",
    payload_metadata: { source: "ledger" },
    evidence_hash: "evidence_hash_001",
    expected_hash: "evidence_hash_001",
    relationship_preserved: true,
    ...overrides,
  };
}

function lineage(overrides: Partial<ReconstructedLineageInput> = {}): ReconstructedLineageInput {
  return {
    lineage_ref: "lineage_001",
    tenant_id: "tenant_alpha",
    lineage_type: "PARENT_CHILD",
    lineage_hash: "lineage_hash_001",
    expected_hash: "lineage_hash_001",
    causal_chain_preserved: true,
    supersession_preserved: true,
    ...overrides,
  };
}

function governance(overrides: Partial<ReconstructedGovernanceInput> = {}): ReconstructedGovernanceInput {
  return {
    governance_ref: "policy_snapshot_001",
    tenant_id: "tenant_alpha",
    governance_type: "POLICY_SNAPSHOT",
    governance_hash: "governance_hash_001",
    expected_hash: "governance_hash_001",
    original_context_preserved: true,
    ...overrides,
  };
}

function governanceDecision(): ReconstructedGovernanceInput {
  return {
    governance_ref: "gov_decision_001",
    tenant_id: "tenant_alpha",
    governance_type: "GOVERNANCE_DECISION",
    governance_hash: "gov_hash_001",
    expected_hash: "gov_hash_001",
    original_context_preserved: true,
  };
}

function schema(overrides: Partial<TruthReplaySchemaInput> = {}): TruthReplaySchemaInput {
  return {
    schema_ref: "schema_replay_contract_v1",
    schema_type: "REPLAY_CONTRACT",
    schema_version: "v1",
    schema_hash: "schema_hash_001",
    expected_hash: "schema_hash_001",
    supported: true,
    ...overrides,
  };
}

function baseRequest(overrides: Partial<TruthReplayInputReconstructionRequest> = {}): TruthReplayInputReconstructionRequest {
  return {
    bundle_id: "bundle_001",
    replay_contract: validContract(),
    tenant_id: "tenant_alpha",
    mission_id: "mission_truth_001",
    truth_records: [truthRecord(), truthRecord({ truth_record_id: "truth_002", record_type: "RISK", record_hash: "truth_hash_002", expected_hash: "truth_hash_002" })],
    events: [event()],
    evidence_inputs: [evidence()],
    lineage_inputs: [lineage()],
    governance_inputs: [governance(), governanceDecision()],
    authority_inputs: [{
      authority_ref: "authority_operator_001",
      tenant_id: "tenant_alpha",
      requester_id: "operator_001",
      execution_authority: "NONE",
      authority_expansion_allowed: false,
      authority_hash: "authority_hash_001",
      expected_hash: "authority_hash_001",
    }],
    schema_inputs: [schema()],
    created_at: "2026-06-24T00:00:00.000Z",
    ...overrides,
  };
}

function bundle(overrides: Partial<TruthReplayInputReconstructionRequest> = {}) {
  return reconstructTruthReplayInputBundle(baseRequest(overrides));
}

function expectFailure(overrides: Partial<TruthReplayInputReconstructionRequest>, code: string) {
  const result = bundle(overrides);
  expect(result.reconstruction_state).toBe("FAILED");
  expect(result.failure_reasons?.map((reason) => reason.code)).toContain(code);
  return result;
}

describe("replayInputReconstruction", () => {
  it("valid replay contract loaded -> PASS", () => {
    const result = bundle();

    expect(result.reconstruction_state).toBe("BUNDLE_CREATED");
    expect(result.certification_state).toBe("INPUT_BUNDLE_CERTIFIED");
    expect(result.completeness_report.complete).toBe(true);
    expect(result.integrity_report.integrity_verified).toBe(true);
  });

  it("missing replay contract -> FAIL", () => {
    expectFailure({ replay_contract: undefined as unknown as ReturnType<typeof validContract> }, "REPLAY_CONTRACT_MISSING");
  });

  it("replay contract hash valid -> PASS", () => {
    expect(bundle().replay_contract_hash).toBeTruthy();
  });

  it("replay contract hash mismatch -> FAIL", () => {
    expectFailure({ replay_contract: { ...validContract(), contract_hash: "wrong_hash" } }, "REPLAY_CONTRACT_HASH_MISMATCH");
  });

  it("unvalidated replay contract used -> FAIL", () => {
    expectFailure({ replay_contract: createDefaultTruthReplayContractFixture() }, "REPLAY_CONTRACT_UNVALIDATED");
  });

  it("reconstruction scope valid -> PASS", () => {
    expect(bundle().input_manifest.tenant_id).toBe("tenant_alpha");
  });

  it("reconstruction scope missing -> FAIL", () => {
    expectFailure({ replay_contract: validContract({ replay_scope: undefined }) }, "RECONSTRUCTION_SCOPE_MISSING");
  });

  it("tenant scope valid -> PASS", () => {
    expect(bundle({ tenant_id: "tenant_alpha" }).tenant_id).toBe("tenant_alpha");
  });

  it("tenant scope violation -> FAIL", () => {
    expectFailure({ tenant_id: "tenant_beta" }, "TENANT_SCOPE_VIOLATION");
  });

  it("mission scope valid -> PASS", () => {
    expect(bundle({ mission_id: "mission_truth_001" }).mission_id).toBe("mission_truth_001");
  });

  it("mission scope violation -> FAIL", () => {
    expectFailure({ mission_id: "mission_other" }, "MISSION_SCOPE_VIOLATION");
  });

  it("source manifest created -> PASS", () => {
    expect(bundle().input_manifest.manifest_hash).toBeTruthy();
  });

  it("source manifest missing required truth record -> FAIL", () => {
    expectFailure({ truth_records: [truthRecord()] }, "REQUIRED_TRUTH_RECORD_MISSING");
  });

  it("required truth records loaded -> PASS", () => {
    expect(bundle().truth_records).toHaveLength(2);
  });

  it("required truth record missing -> FAIL", () => {
    expectFailure({ truth_records: [] }, "REQUIRED_TRUTH_RECORD_MISSING");
  });

  it("truth record hash valid -> PASS", () => {
    expect(bundle().integrity_report.truth_records_integrity_verified).toBe(true);
  });

  it("truth record hash mismatch -> FAIL", () => {
    expectFailure({ truth_records: [truthRecord({ expected_hash: "other" }), truthRecord({ truth_record_id: "truth_002", record_type: "RISK", record_hash: "truth_hash_002", expected_hash: "truth_hash_002" })] }, "TRUTH_RECORD_HASH_MISMATCH");
  });

  it("event inputs loaded -> PASS", () => {
    expect(bundle().events).toHaveLength(1);
  });

  it("event missing when required -> FAIL", () => {
    const contract = validContract({ source_event_ids: ["event_001"] });
    expectFailure({ replay_contract: contract, events: [] }, "REQUIRED_EVENT_MISSING");
  });

  it("event ordering deterministic -> PASS", () => {
    expect(bundle().ordering_context.ordered_input_refs).toContain("event_001");
  });

  it("ambiguous event ordering -> FAIL", () => {
    expectFailure({ events: [event({ event_timestamp: undefined, ledger_sequence: undefined })] }, "EVENT_ORDERING_AMBIGUOUS");
  });

  it("evidence inputs loaded -> PASS", () => {
    expect(bundle().evidence_inputs).toHaveLength(1);
  });

  it("evidence missing when required -> FAIL", () => {
    expectFailure({ evidence_inputs: [] }, "REQUIRED_EVIDENCE_MISSING");
  });

  it("evidence hash mismatch -> FAIL", () => {
    expectFailure({ evidence_inputs: [evidence({ expected_hash: "other" })] }, "EVIDENCE_HASH_MISMATCH");
  });

  it("evidence relationship preserved -> PASS", () => {
    expect(bundle().integrity_report.evidence_integrity_verified).toBe(true);
  });

  it("evidence relationship broken -> FAIL", () => {
    expectFailure({ evidence_inputs: [evidence({ relationship_preserved: false })] }, "EVIDENCE_RELATIONSHIP_BROKEN");
  });

  it("lineage inputs loaded -> PASS", () => {
    expect(bundle().lineage_inputs).toHaveLength(1);
  });

  it("lineage missing when required -> FAIL", () => {
    expectFailure({ lineage_inputs: [] }, "REQUIRED_LINEAGE_MISSING");
  });

  it("causal chain reconstructed -> PASS", () => {
    expect(bundle().integrity_report.lineage_integrity_verified).toBe(true);
  });

  it("causal chain broken -> FAIL", () => {
    expectFailure({ lineage_inputs: [lineage({ causal_chain_preserved: false })] }, "CAUSAL_CHAIN_BROKEN");
  });

  it("supersession history preserved -> PASS", () => {
    const result = bundle({ truth_records: [truthRecord({ superseded_by: "truth_003" }), truthRecord({ truth_record_id: "truth_002", record_type: "RISK", record_hash: "truth_hash_002", expected_hash: "truth_hash_002" })] });

    expect(result.input_manifest.superseded_inputs.map((input) => input.input_ref)).toContain("truth_001");
  });

  it("governance context loaded -> PASS", () => {
    expect(bundle().governance_inputs.map((input) => input.governance_ref)).toContain("policy_snapshot_001");
  });

  it("policy snapshot missing -> FAIL", () => {
    expectFailure({ governance_inputs: [governanceDecision()] }, "POLICY_SNAPSHOT_MISSING");
  });

  it("governance decision missing -> FAIL", () => {
    expectFailure({ governance_inputs: [governance()] }, "REQUIRED_GOVERNANCE_MISSING");
  });

  it("current policy substituted for original policy -> FAIL", () => {
    expectFailure({ governance_inputs: [governance({ current_policy_substituted: true }), governanceDecision()] }, "CURRENT_POLICY_SUBSTITUTED");
  });

  it("authority context reconstructed -> PASS", () => {
    expect(bundle().authority_inputs[0].execution_authority).toBe("NONE");
  });

  it("execution authority remains none -> PASS", () => {
    expect(bundle().executionAuthorized).toBe(false);
  });

  it("execution authority detected -> FAIL", () => {
    expectFailure({
      authority_inputs: [{
        authority_ref: "authority_operator_001",
        tenant_id: "tenant_alpha",
        requester_id: "operator_001",
        execution_authority: "TOOL" as "NONE",
        authority_expansion_allowed: false,
        authority_hash: "authority_hash_001",
      }],
    }, "EXECUTION_AUTHORITY_DETECTED");
  });

  it("authority expansion attempted -> FAIL", () => {
    expectFailure({
      authority_inputs: [{
        authority_ref: "authority_operator_001",
        tenant_id: "tenant_alpha",
        requester_id: "operator_001",
        execution_authority: "NONE",
        authority_expansion_allowed: true,
        authority_hash: "authority_hash_001",
      }],
    }, "AUTHORITY_EXPANSION_DETECTED");
  });

  it("schema context loaded -> PASS", () => {
    expect(bundle().schema_context.schema_context_hash).toBeTruthy();
  });

  it("required schema missing -> FAIL", () => {
    expectFailure({ schema_inputs: [] }, "REQUIRED_SCHEMA_MISSING");
  });

  it("schema hash mismatch -> FAIL", () => {
    expectFailure({ schema_inputs: [schema({ expected_hash: "other" })] }, "SCHEMA_HASH_MISMATCH");
  });

  it("deterministic ordering applied -> PASS", () => {
    expect(bundle().ordering_context.ordering_hash).toBeTruthy();
  });

  it("non-deterministic ordering detected -> FAIL", () => {
    expectFailure({ force_ambiguous_ordering: true }, "EVENT_ORDERING_AMBIGUOUS");
  });

  it("canonical serialization stable -> PASS", () => {
    const first = canonicalizeTruthReplayInputBundle(bundle());
    const second = canonicalizeTruthReplayInputBundle(bundle());

    expect(first).toBe(second);
  });

  it("unstable serialization detected -> FAIL", () => {
    expectFailure({ force_unstable_serialization: true }, "UNSTABLE_SERIALIZATION_DETECTED");
  });

  it("wall-clock value injected -> FAIL", () => {
    expectFailure({ force_wall_clock_injection: true }, "WALL_CLOCK_VALUE_INJECTED");
  });

  it("input manifest hash generated -> PASS", () => {
    expect(bundle().input_manifest.manifest_hash).toBeTruthy();
  });

  it("full input bundle hash generated -> PASS", () => {
    expect(bundle().input_hashes.full_input_bundle_hash).toBeTruthy();
  });

  it("same inputs produce same bundle hash -> PASS", () => {
    expect(bundle().input_hashes.full_input_bundle_hash).toBe(bundle().input_hashes.full_input_bundle_hash);
  });

  it("reordered object keys produce same bundle hash -> PASS", () => {
    const first = bundle();
    const second = reconstructTruthReplayInputBundle({
      ...baseRequest(),
      evidence_inputs: [{
        relationship_preserved: true,
        expected_hash: "evidence_hash_001",
        evidence_hash: "evidence_hash_001",
        payload_metadata: { source: "ledger" },
        tenant_id: "tenant_alpha",
        evidence_ref: "evidence_001",
      }],
    });

    expect(first.input_hashes.full_input_bundle_hash).toBe(second.input_hashes.full_input_bundle_hash);
  });

  it("changed evidence changes bundle hash -> PASS", () => {
    expect(bundle().input_hashes.full_input_bundle_hash).not.toBe(bundle({ evidence_inputs: [evidence({ evidence_hash: "changed", expected_hash: "changed" })] }).input_hashes.full_input_bundle_hash);
  });

  it("changed governance context changes bundle hash -> PASS", () => {
    expect(bundle().input_hashes.full_input_bundle_hash).not.toBe(bundle({ governance_inputs: [governance({ governance_hash: "changed", expected_hash: "changed" }), governanceDecision()] }).input_hashes.full_input_bundle_hash);
  });

  it("changed lineage changes bundle hash -> PASS", () => {
    expect(bundle().input_hashes.full_input_bundle_hash).not.toBe(bundle({ lineage_inputs: [lineage({ lineage_hash: "changed", expected_hash: "changed" })] }).input_hashes.full_input_bundle_hash);
  });

  it("completeness report generated -> PASS", () => {
    expect(bundle().completeness_report.required_truth_records_complete).toBe(true);
  });

  it("missing required input listed -> PASS", () => {
    const result = expectFailure({ truth_records: [] }, "REQUIRED_TRUTH_RECORD_MISSING");

    expect(result.input_manifest.missing_inputs.map((input) => input.input_ref)).toContain("truth_001");
  });

  it("integrity report generated -> PASS", () => {
    expect(bundle().integrity_report.integrity_state).toBe("VERIFIED");
  });

  it("corrupted input detected -> FAIL", () => {
    expectFailure({ truth_records: [truthRecord({ corrupted: true }), truthRecord({ truth_record_id: "truth_002", record_type: "RISK", record_hash: "truth_hash_002", expected_hash: "truth_hash_002" })] }, "TRUTH_RECORD_CORRUPTED");
  });

  it("unauthorized input detected -> FAIL", () => {
    expectFailure({ truth_records: [truthRecord({ authorized: false }), truthRecord({ truth_record_id: "truth_002", record_type: "RISK", record_hash: "truth_hash_002", expected_hash: "truth_hash_002" })] }, "TRUTH_RECORD_UNAUTHORIZED");
  });

  it("restricted input without authorization -> FAIL", () => {
    expectFailure({ evidence_inputs: [evidence({ restricted: true, authorized: false })] }, "RESTRICTED_INPUT_UNAUTHORIZED");
  });

  it("unauthorized record type -> FAIL", () => {
    expectFailure({ truth_records: [truthRecord({ record_type: "SECRET" }), truthRecord({ truth_record_id: "truth_002", record_type: "RISK", record_hash: "truth_hash_002", expected_hash: "truth_hash_002" })] }, "RECORD_TYPE_UNAUTHORIZED");
  });

  it("partial reconstruction without escalation -> FAIL", () => {
    expectFailure({ truth_records: [] }, "PARTIAL_RECONSTRUCTION_REQUIRES_ESCALATION");
  });

  it("partial reconstruction with escalation -> ESCALATION_REQUIRED", () => {
    const result = bundle({
      replay_contract: validContract({
        failure_policy: {
          ...validContract().failure_policy,
          allow_partial_replay: true,
          partial_replay_requires_escalation: true,
        },
      }),
      truth_records: [],
    });

    expect(result.reconstruction_state).toBe("ESCALATED");
    expect(result.completeness_report.escalation_required).toBe(true);
  });

  it("certified input bundle created -> PASS", () => {
    expect(bundle().certification_state).toBe("INPUT_BUNDLE_CERTIFIED");
  });

  it("incomplete bundle certified -> FAIL", () => {
    expect(bundle({ truth_records: [] }).certification_state).toBe("RECONSTRUCTION_FAILED");
  });

  it("reconstruction audit event emitted -> PASS", () => {
    expect(bundle().audit_events).toContain(TRUTH_REPLAY_INPUT_RECONSTRUCTION_EVENTS.REPLAY_INPUT_BUNDLE_CREATED);
  });

  it("reconstruction failure recorded -> PASS", () => {
    expect(expectFailure({ truth_records: [] }, "REQUIRED_TRUTH_RECORD_MISSING").audit_events).toContain("REPLAY_INPUT_RECONSTRUCTION_FAILED");
  });

  it("storage representation is immutable and hash-addressed", () => {
    const storage = toTruthReplayInputBundleStorageRecord(bundle());

    expect(storage.bundle_id).toBe("bundle_001");
    expect(storage.full_input_bundle_hash).toBeTruthy();
    expect(storage.truth_records_json).toContain("truth_001");
  });

  it.each<[TruthReplayInputReconstructionState, TruthReplayInputReconstructionState]>([
    ["REQUESTED", "CONTRACT_LOADED"],
    ["CONTRACT_LOADED", "SCOPE_VERIFIED"],
    ["SCOPE_VERIFIED", "SOURCES_DISCOVERED"],
    ["SOURCES_DISCOVERED", "SOURCES_LOADED"],
    ["SOURCES_LOADED", "ORDERED"],
    ["ORDERED", "CANONICALIZED"],
    ["CANONICALIZED", "INTEGRITY_VERIFIED"],
    ["INTEGRITY_VERIFIED", "BUNDLE_CREATED"],
    ["BUNDLE_CREATED", "ARCHIVED"],
  ])("allows reconstruction transition %s -> %s", (fromState, toState) => {
    expect(validateTruthReplayInputReconstructionTransition(fromState, toState).valid).toBe(true);
  });

  it("blocks failed to bundle transition", () => {
    expect(validateTruthReplayInputReconstructionTransition("FAILED", "BUNDLE_CREATED").valid).toBe(false);
  });

  it("blocks archived to sources loaded transition", () => {
    expect(validateTruthReplayInputReconstructionTransition("ARCHIVED", "SOURCES_LOADED").valid).toBe(false);
  });
});
