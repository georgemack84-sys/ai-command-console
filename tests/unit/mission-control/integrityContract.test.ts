import { describe, expect, it } from "vitest";
import {
  createDefaultTruthIntegrityContractFixture,
  getTruthIntegrityDominantResultState,
  hashTruthIntegrityContract,
  normalizeTruthIntegrityContract,
  toTruthIntegrityContractStorageRecord,
  TRUTH_INTEGRITY_CONTRACT_EVENTS,
  TRUTH_INTEGRITY_RESULT_PRECEDENCE,
  validateTruthIntegrityContract,
  validateTruthIntegrityLifecycleTransition,
} from "@/services/mission-control";
import type {
  TruthIntegrityContract,
  TruthIntegrityFailureCode,
  TruthIntegrityLifecycleState,
  TruthIntegrityResultState,
} from "@/services/mission-control";

function mutableContract(overrides: Partial<TruthIntegrityContract> = {}): TruthIntegrityContract {
  return {
    ...JSON.parse(JSON.stringify(createDefaultTruthIntegrityContractFixture())),
    contract_hash: undefined,
    ...overrides,
  } as TruthIntegrityContract;
}

function expectValid(contract: unknown = mutableContract()) {
  const result = validateTruthIntegrityContract(contract);
  expect(result.errors).toEqual([]);
  expect(result.state).toBe("VALID");
  expect(result.contract_hash).toBeTruthy();
  expect(result.normalized_contract?.contract_hash).toBe(result.contract_hash);
  return result;
}

function expectInvalid(contract: unknown, code: TruthIntegrityFailureCode) {
  const result = validateTruthIntegrityContract(contract);
  expect(result.state).toBe("INVALID");
  expect(result.errors.map((error) => error.code)).toContain(code);
  expect(result.normalized_contract).toBeUndefined();
  expect(result.contract_hash).toBeUndefined();
  return result;
}

describe("Mission Control Phase 6I.1 Integrity Contract", () => {
  it("defines required integrity contract events", () => {
    expect(Object.keys(TRUTH_INTEGRITY_CONTRACT_EVENTS)).toEqual([
      "INTEGRITY_CONTRACT_CREATED",
      "INTEGRITY_CONTRACT_VALIDATED",
      "INTEGRITY_CONTRACT_REJECTED",
      "INTEGRITY_TARGET_BOUND",
      "INTEGRITY_SCOPE_VERIFIED",
      "INTEGRITY_SOURCES_BOUND",
      "INTEGRITY_HASH_REQUIREMENTS_BOUND",
      "INTEGRITY_SCHEMA_REQUIREMENTS_BOUND",
      "INTEGRITY_GOVERNANCE_BOUND",
      "INTEGRITY_AUTHORITY_VERIFIED",
      "INTEGRITY_EVIDENCE_CONTEXT_BOUND",
      "INTEGRITY_LINEAGE_CONTEXT_BOUND",
      "INTEGRITY_REPLAY_CONTEXT_BOUND",
      "INTEGRITY_READY",
      "INTEGRITY_CONTRACT_VALIDATION_FAILED",
    ]);
  });

  it("integrity result precedence is explicit", () => {
    expect(TRUTH_INTEGRITY_RESULT_PRECEDENCE.INVALID).toBeGreaterThan(TRUTH_INTEGRITY_RESULT_PRECEDENCE.UNAUTHORIZED);
    expect(getTruthIntegrityDominantResultState(["VERIFIED", "MISMATCH", "INCOMPLETE", "CORRUPTED", "UNAUTHORIZED", "INVALID"])).toBe("INVALID");
    expect(getTruthIntegrityDominantResultState(["VERIFIED", "MISMATCH"])).toBe("MISMATCH");
  });

  it("integrity contract present -> PASS", () => {
    expectValid();
  });

  it("integrity contract missing -> FAIL", () => {
    expectInvalid(undefined, "INTEGRITY_CONTRACT_MISSING");
  });

  it("integrity_contract_id present -> PASS", () => {
    expect(validateTruthIntegrityContract(mutableContract()).errors.map((error) => error.code)).not.toContain("INTEGRITY_CONTRACT_ID_MISSING");
  });

  it("integrity_contract_id missing -> FAIL", () => {
    expectInvalid(mutableContract({ integrity_contract_id: "" }), "INTEGRITY_CONTRACT_ID_MISSING");
  });

  it("tenant_id present -> PASS", () => {
    expect(validateTruthIntegrityContract(mutableContract()).errors.map((error) => error.code)).not.toContain("TENANT_ID_MISSING");
  });

  it("tenant_id missing -> FAIL", () => {
    expectInvalid(mutableContract({ tenant_id: "" }), "TENANT_ID_MISSING");
  });

  it("mission_id valid when mission-scoped -> PASS", () => {
    expectValid(mutableContract({
      integrity_type: "MISSION_INTEGRITY",
      integrity_scope: { ...mutableContract().integrity_scope, scope_type: "MISSION", allowed_target_types: ["MISSION"] },
      integrity_target: { target_type: "MISSION", target_ids: ["mission_truth_001"] },
    }));
  });

  it("mission_id missing when required -> FAIL", () => {
    expectInvalid(mutableContract({
      mission_id: undefined,
      integrity_type: "MISSION_INTEGRITY",
      integrity_scope: { ...mutableContract().integrity_scope, scope_type: "MISSION", allowed_target_types: ["MISSION"] },
      integrity_target: { target_type: "MISSION", target_ids: ["mission_truth_001"] },
    }), "MISSION_ID_MISSING");
  });

  it("integrity type valid -> PASS", () => {
    expect(validateTruthIntegrityContract(mutableContract()).errors.map((error) => error.code)).not.toContain("INTEGRITY_TYPE_INVALID");
  });

  it("integrity type invalid -> FAIL", () => {
    expectInvalid(mutableContract({ integrity_type: "BOGUS" as TruthIntegrityContract["integrity_type"] }), "INTEGRITY_TYPE_INVALID");
  });

  it("integrity target present -> PASS", () => {
    expect(validateTruthIntegrityContract(mutableContract()).errors.map((error) => error.code)).not.toContain("INTEGRITY_TARGET_MISSING");
  });

  it("integrity target missing -> FAIL", () => {
    expectInvalid(mutableContract({ integrity_target: undefined as unknown as TruthIntegrityContract["integrity_target"] }), "INTEGRITY_TARGET_MISSING");
  });

  it("integrity target with empty IDs -> FAIL", () => {
    expectInvalid(mutableContract({ integrity_target: { target_type: "FULL_CONTEXT", target_ids: [] } }), "INTEGRITY_TARGET_INVALID");
  });

  it("integrity type and target compatible -> PASS", () => {
    expectValid(mutableContract({
      integrity_type: "REPLAY_DETERMINISM_GATE_INTEGRITY",
      integrity_scope: { ...mutableContract().integrity_scope, scope_type: "REPLAY", allowed_target_types: ["REPLAY_DETERMINISM_GATE"] },
      integrity_target: { target_type: "REPLAY_DETERMINISM_GATE", target_ids: ["gate_001"] },
    }));
  });

  it("integrity type and target incompatible -> FAIL", () => {
    expectInvalid(mutableContract({
      integrity_type: "EVENT_INTEGRITY",
      integrity_target: { target_type: "RECOMMENDATION", target_ids: ["rec_001"] },
    }), "INTEGRITY_TYPE_TARGET_INCOMPATIBLE");
  });

  it("integrity scope present -> PASS", () => {
    expect(validateTruthIntegrityContract(mutableContract()).errors.map((error) => error.code)).not.toContain("INTEGRITY_SCOPE_MISSING");
  });

  it("integrity scope missing -> FAIL", () => {
    expectInvalid(mutableContract({ integrity_scope: undefined as unknown as TruthIntegrityContract["integrity_scope"] }), "INTEGRITY_SCOPE_MISSING");
  });

  it("authorized tenant scope -> PASS", () => {
    expectValid();
  });

  it("unauthorized cross-tenant scope -> FAIL", () => {
    expectInvalid(mutableContract({
      integrity_scope: { ...mutableContract().integrity_scope, allowed_tenant_ids: ["tenant_beta"] },
    }), "TENANT_SCOPE_VIOLATION");
  });

  it("mission scope preserved -> PASS", () => {
    expectValid();
  });

  it("mission scope violation -> FAIL", () => {
    expectInvalid(mutableContract({
      integrity_scope: { ...mutableContract().integrity_scope, allowed_mission_ids: ["mission_other"] },
    }), "MISSION_SCOPE_VIOLATION");
  });

  it("restricted fields without redaction -> FAIL", () => {
    expectInvalid(mutableContract({
      integrity_scope: { ...mutableContract().integrity_scope, restricted_fields: ["payload.secret"], redaction_required: false },
    }), "REDACTION_REQUIRED");
  });

  it("requester present -> PASS", () => {
    expect(validateTruthIntegrityContract(mutableContract()).errors.map((error) => error.code)).not.toContain("REQUESTER_INVALID");
  });

  it("requester missing -> FAIL", () => {
    expectInvalid(mutableContract({ requested_by: undefined as unknown as TruthIntegrityContract["requested_by"] }), "REQUESTER_INVALID");
  });

  it("requester read authority verified -> PASS", () => {
    expectValid();
  });

  it("requester read authority missing -> FAIL", () => {
    expectInvalid(mutableContract({
      authority_context: { ...mutableContract().authority_context, read_authority_verified: false },
    }), "READ_AUTHORITY_UNVERIFIED");
  });

  it.each([
    ["TRUTH_RECORD_INTEGRITY", "truth_record_ids"],
    ["EVENT_INTEGRITY", "event_ids"],
    ["EVIDENCE_INTEGRITY", "evidence_refs"],
    ["LINEAGE_INTEGRITY", "lineage_refs"],
    ["GOVERNANCE_INTEGRITY", "governance_refs"],
    ["RECOMMENDATION_INTEGRITY", "recommendation_refs"],
    ["RISK_INTEGRITY", "risk_refs"],
    ["CONFIDENCE_INTEGRITY", "confidence_refs"],
    ["REPLAY_CONTRACT_INTEGRITY", "replay_refs"],
    ["SCHEMA_INTEGRITY", "schema_refs"],
  ] as const)("source refs present when required for %s -> PASS", (integrityType) => {
    const contract = mutableContract({
      integrity_type: integrityType,
      integrity_target: compatibleTarget(integrityType),
      integrity_scope: { ...mutableContract().integrity_scope, allowed_target_types: [compatibleTarget(integrityType).target_type] },
    });
    expect(validateTruthIntegrityContract(contract).errors.map((error) => error.code)).not.toContain("SOURCE_REFS_MISSING");
  });

  it("source refs missing -> FAIL", () => {
    expectInvalid(mutableContract({ source_refs: {} }), "SOURCE_REFS_MISSING");
  });

  it("expected integrity present -> PASS", () => {
    expect(validateTruthIntegrityContract(mutableContract()).errors.map((error) => error.code)).not.toContain("EXPECTED_INTEGRITY_MISSING");
  });

  it("expected integrity missing -> FAIL", () => {
    expectInvalid(mutableContract({ expected_integrity: undefined as unknown as TruthIntegrityContract["expected_integrity"] }), "EXPECTED_INTEGRITY_MISSING");
  });

  it("expected hash present when required -> PASS", () => {
    expectValid();
  });

  it("expected hash missing -> FAIL", () => {
    expectInvalid(mutableContract({
      expected_integrity: { ...mutableContract().expected_integrity, expected_hashes: [] },
    }), "EXPECTED_HASH_MISSING");
  });

  it("expected tenant missing -> FAIL", () => {
    expectInvalid(mutableContract({
      expected_integrity: { ...mutableContract().expected_integrity, expected_tenant_id: "" },
    }), "EXPECTED_TENANT_MISSING");
  });

  it("expected result invalid -> FAIL", () => {
    expectInvalid(mutableContract({
      expected_integrity: { ...mutableContract().expected_integrity, expected_integrity_result: "BOGUS" as TruthIntegrityResultState },
    }), "EXPECTED_STATE_INVALID");
  });

  it("observed tenant mismatch -> FAIL", () => {
    expectInvalid(mutableContract({
      observed_integrity: { observed_hashes: [], observed_tenant_id: "tenant_beta", observed_mission_id: "mission_truth_001" },
    }), "OBSERVED_TENANT_MISMATCH");
  });

  it("observed mission mismatch -> FAIL", () => {
    expectInvalid(mutableContract({
      observed_integrity: { observed_hashes: [], observed_tenant_id: "tenant_alpha", observed_mission_id: "mission_beta" },
    }), "OBSERVED_MISSION_MISMATCH");
  });

  it("hash requirements valid -> PASS", () => {
    expectValid();
  });

  it("unsupported hash algorithm -> FAIL", () => {
    expectInvalid(mutableContract({
      hash_requirements: { ...mutableContract().hash_requirements, required_hash_algorithm: "MD5" as "SHA256" },
    }), "UNSUPPORTED_HASH_ALGORITHM");
  });

  it("canonical serialization required -> PASS", () => {
    expect(validateTruthIntegrityContract(mutableContract()).errors.map((error) => error.code)).not.toContain("HASH_REQUIREMENTS_INVALID");
  });

  it("unstable serialization allowed -> FAIL", () => {
    expectInvalid(mutableContract({
      hash_requirements: { ...mutableContract().hash_requirements, unstable_serialization_allowed: true },
    }), "UNSTABLE_SERIALIZATION_ALLOWED");
  });

  it("schema requirements valid -> PASS", () => {
    expectValid();
  });

  it("schema version missing when required -> FAIL", () => {
    expectInvalid(mutableContract({
      schema_requirements: { ...mutableContract().schema_requirements, expected_schema_versions: [] },
    }), "EXPECTED_SCHEMA_VERSION_MISSING");
  });

  it("schema hash missing -> FAIL", () => {
    expectInvalid(mutableContract({
      expected_integrity: { ...mutableContract().expected_integrity, expected_schema_versions: [{ schema_ref: "schema_integrity_v1", schema_version: "integrity_contract/v1" }] },
    }), "SCHEMA_REQUIREMENTS_INVALID");
  });

  it("schema mismatch policy present -> PASS", () => {
    expect(validateTruthIntegrityContract(mutableContract()).errors.map((error) => error.code)).not.toContain("SCHEMA_REQUIREMENTS_INVALID");
  });

  it("silent schema substitution allowed -> FAIL", () => {
    expectInvalid(mutableContract({
      schema_requirements: { ...mutableContract().schema_requirements, allow_silent_schema_substitution: true },
    }), "SCHEMA_SUBSTITUTION_ALLOWED");
  });

  it("governance context present when required -> PASS", () => {
    expectValid();
  });

  it("governance context missing -> FAIL", () => {
    expectInvalid(mutableContract({ governance_context: undefined as unknown as TruthIntegrityContract["governance_context"] }), "GOVERNANCE_CONTEXT_MISSING");
  });

  it("policy snapshot missing when historical policy required -> FAIL", () => {
    expectInvalid(mutableContract({
      governance_context: { ...mutableContract().governance_context, policy_snapshot_id: undefined },
    }), "POLICY_SNAPSHOT_MISSING");
  });

  it("current policy substitution blocked -> PASS", () => {
    expect(validateTruthIntegrityContract(mutableContract()).errors.map((error) => error.code)).not.toContain("CURRENT_POLICY_SUBSTITUTION_ALLOWED");
  });

  it("current policy substitution allowed -> FAIL", () => {
    expectInvalid(mutableContract({
      governance_context: { ...mutableContract().governance_context, current_policy_substitution_allowed: true },
    }), "CURRENT_POLICY_SUBSTITUTION_ALLOWED");
  });

  it("governance bypass blocked -> PASS", () => {
    expect(validateTruthIntegrityContract(mutableContract()).errors.map((error) => error.code)).not.toContain("GOVERNANCE_BYPASS_ALLOWED");
  });

  it("governance bypass allowed -> FAIL", () => {
    expectInvalid(mutableContract({
      governance_context: { ...mutableContract().governance_context, governance_bypass_allowed: true },
    }), "GOVERNANCE_BYPASS_ALLOWED");
  });

  it("authority context valid -> PASS", () => {
    expectValid();
  });

  it("execution authority detected -> FAIL", () => {
    expectInvalid(mutableContract({
      authority_context: { ...mutableContract().authority_context, execution_authority: "RUN" as "NONE" },
    }), "EXECUTION_AUTHORITY_DETECTED");
  });

  it("authority expansion attempted -> FAIL", () => {
    expectInvalid(mutableContract({
      authority_context: { ...mutableContract().authority_context, authority_expansion_allowed: true },
    }), "AUTHORITY_EXPANSION_DETECTED");
  });

  it("source mutation attempted -> FAIL", () => {
    expectInvalid(mutableContract({
      authority_context: { ...mutableContract().authority_context, source_mutation_allowed: true },
    }), "SOURCE_MUTATION_ATTEMPTED");
  });

  it("audit-only write allowed -> PASS", () => {
    expectValid(mutableContract({
      authority_context: { ...mutableContract().authority_context, allowed_writes: "INTEGRITY_AUDIT_ONLY", write_authority_verified: true },
    }));
  });

  it("unauthorized write attempted -> FAIL", () => {
    expectInvalid(mutableContract({
      authority_context: { ...mutableContract().authority_context, allowed_writes: "SOURCE_WRITE" as "NONE" },
    }), "UNAUTHORIZED_WRITE_ATTEMPTED");
  });

  it("evidence context present when required -> PASS", () => {
    expectValid();
  });

  it("evidence context missing when required -> FAIL", () => {
    expectInvalid(mutableContract({ evidence_context: undefined }), "EVIDENCE_CONTEXT_MISSING");
  });

  it("required evidence refs missing -> FAIL", () => {
    expectInvalid(mutableContract({
      evidence_context: { ...mutableContract().evidence_context!, required_evidence_refs: [] },
    }), "EVIDENCE_CONTEXT_MISSING");
  });

  it("lineage context present when required -> PASS", () => {
    expectValid();
  });

  it("lineage context missing when required -> FAIL", () => {
    expectInvalid(mutableContract({ lineage_context: undefined }), "LINEAGE_CONTEXT_MISSING");
  });

  it("required lineage refs missing -> FAIL", () => {
    expectInvalid(mutableContract({
      lineage_context: { ...mutableContract().lineage_context!, required_lineage_refs: [] },
    }), "LINEAGE_CONTEXT_MISSING");
  });

  it("replay context present for replay integrity -> PASS", () => {
    expectValid(mutableContract({
      integrity_type: "REPLAY_CONTRACT_INTEGRITY",
      integrity_scope: { ...mutableContract().integrity_scope, scope_type: "REPLAY", allowed_target_types: ["REPLAY_CONTRACT"] },
      integrity_target: { target_type: "REPLAY_CONTRACT", target_ids: ["replay_contract_001"] },
    }));
  });

  it("replay context missing for replay integrity -> FAIL", () => {
    expectInvalid(mutableContract({ replay_context: undefined }), "REPLAY_CONTEXT_MISSING");
  });

  it("replay hash chain required -> PASS", () => {
    expectValid();
  });

  it("replay hash chain missing -> FAIL", () => {
    expectInvalid(mutableContract({
      replay_context: { ...mutableContract().replay_context!, replay_hash_chain_required: false },
    }), "REPLAY_HASH_CHAIN_MISSING");
  });

  it("replay provenance mismatch policy present -> PASS", () => {
    expect(validateTruthIntegrityContract(mutableContract()).errors.map((error) => error.code)).not.toContain("REPLAY_PROVENANCE_POLICY_MISSING");
  });

  it("replay gate state requirement valid -> PASS", () => {
    expectValid();
  });

  it("replay gate state invalid -> FAIL", () => {
    expectInvalid(mutableContract({
      replay_context: { ...mutableContract().replay_context!, required_gate_state: "BOGUS" as TruthIntegrityContract["replay_context"]["required_gate_state"] },
    }), "REPLAY_GATE_STATE_INVALID");
  });

  it("failure policy present -> PASS", () => {
    expectValid();
  });

  it("failure policy missing -> FAIL", () => {
    expectInvalid(mutableContract({ failure_policy: undefined as unknown as TruthIntegrityContract["failure_policy"] }), "FAILURE_POLICY_INVALID");
  });

  it("partial integrity without escalation -> FAIL", () => {
    expectInvalid(mutableContract({
      failure_policy: { ...mutableContract().failure_policy, allow_partial_integrity_check: true, partial_check_requires_escalation: false },
    }), "PARTIAL_INTEGRITY_REQUIRES_ESCALATION");
  });

  it("partial integrity with escalation returns ESCALATION_REQUIRED", () => {
    const result = validateTruthIntegrityContract(mutableContract({
      failure_policy: { ...mutableContract().failure_policy, allow_partial_integrity_check: true, partial_check_requires_escalation: true },
    }));
    expect(result.state).toBe("ESCALATION_REQUIRED");
    expect(result.escalation_reasons.map((reason) => reason.code)).toContain("PARTIAL_INTEGRITY_REQUIRES_ESCALATION");
  });

  it("output policy present -> PASS", () => {
    expectValid();
  });

  it("output mutates source records -> FAIL", () => {
    expectInvalid(mutableContract({
      output_policy: { ...mutableContract().output_policy, mutate_source_records: true },
    }), "SOURCE_MUTATION_ATTEMPTED");
  });

  it("audit policy present -> PASS", () => {
    expectValid();
  });

  it("audit_required true -> PASS", () => {
    expect(validateTruthIntegrityContract(mutableContract()).errors.map((error) => error.code)).not.toContain("AUDIT_POLICY_INVALID");
  });

  it("audit policy missing required fields -> FAIL", () => {
    expectInvalid(mutableContract({
      audit_policy: { ...mutableContract().audit_policy, include_hashes: false },
    }), "AUDIT_POLICY_INVALID");
  });

  it("contract hash generated -> PASS", () => {
    const result = expectValid();
    expect(result.contract_hash).toBe(hashTruthIntegrityContract(mutableContract()));
  });

  it("same contract produces same hash -> PASS", () => {
    expect(hashTruthIntegrityContract(mutableContract())).toBe(hashTruthIntegrityContract(mutableContract()));
  });

  it("reordered object keys produce same hash -> PASS", () => {
    const first = mutableContract();
    const second = mutableContract({
      governance_context: {
        fail_on_governance_mismatch: true,
        governance_bypass_allowed: false,
        current_policy_substitution_allowed: false,
        historical_policy_required: true,
        escalation_refs: [],
        restriction_refs: ["restriction_001"],
        governance_decision_refs: ["gov_decision_001"],
        governance_ruleset_id: "governance_ruleset_001",
        constitution_version: "constitution_v1",
        policy_snapshot_id: "policy_snapshot_001",
      },
    });
    expect(hashTruthIntegrityContract(first)).toBe(hashTruthIntegrityContract(second));
  });

  it("changed target changes hash -> PASS", () => {
    expect(hashTruthIntegrityContract(mutableContract())).not.toBe(hashTruthIntegrityContract(mutableContract({
      integrity_target: { target_type: "FULL_CONTEXT", target_ids: ["full_context_002"] },
    })));
  });

  it("changed expected hash changes contract hash -> PASS", () => {
    expect(hashTruthIntegrityContract(mutableContract())).not.toBe(hashTruthIntegrityContract(mutableContract({
      expected_integrity: {
        ...mutableContract().expected_integrity,
        expected_hashes: [{ ref: "full_context_001", hash: "full_context_hash_002", algorithm: "SHA256", canonical_serialization: "STABLE_JSON" }],
      },
    })));
  });

  it("changed governance context changes hash -> PASS", () => {
    expect(hashTruthIntegrityContract(mutableContract())).not.toBe(hashTruthIntegrityContract(mutableContract({
      governance_context: { ...mutableContract().governance_context, governance_ruleset_id: "governance_ruleset_002" },
    })));
  });

  it("changed authority context changes hash -> PASS", () => {
    expect(hashTruthIntegrityContract(mutableContract())).not.toBe(hashTruthIntegrityContract(mutableContract({
      authority_context: { ...mutableContract().authority_context, allowed_writes: "NONE" },
    })));
  });

  it("contract hash mismatch fails closed", () => {
    expectInvalid({ ...normalizeTruthIntegrityContract(mutableContract()), contract_hash: "wrong_hash" }, "CONTRACT_HASH_MISMATCH");
  });

  it("invalid contract rejected before verification -> PASS", () => {
    expectInvalid(mutableContract({ authority_context: { ...mutableContract().authority_context, execution_authority: "RUN" as "NONE" } }), "EXECUTION_AUTHORITY_DETECTED");
  });

  it("valid contract accepted for future verification -> PASS", () => {
    expectValid();
    expect(validateTruthIntegrityLifecycleTransition("REQUESTED", "VALIDATED").valid).toBe(true);
  });

  it("storage representation preserves canonical JSON fields", () => {
    const storage = toTruthIntegrityContractStorageRecord(mutableContract());
    expect(storage.integrity_contract_id).toBe("integrity_contract_001");
    expect(storage.integrity_scope_json).toContain("allowed_tenant_ids");
    expect(storage.contract_hash).toBeTruthy();
  });

  it("lifecycle state invalid -> FAIL", () => {
    expectInvalid(mutableContract({ lifecycle_state: "BOGUS" as TruthIntegrityContract["lifecycle_state"] }), "LIFECYCLE_STATE_INVALID");
  });

  it("certification state invalid -> FAIL", () => {
    expectInvalid(mutableContract({ certification_state: "BOGUS" as TruthIntegrityContract["certification_state"] }), "CERTIFICATION_STATE_INVALID");
  });

  it.each<[TruthIntegrityLifecycleState, TruthIntegrityLifecycleState]>([
    ["REQUESTED", "VALIDATED"],
    ["REQUESTED", "REJECTED"],
    ["VALIDATED", "READY"],
    ["READY", "ARCHIVED"],
    ["REJECTED", "ARCHIVED"],
  ])("allows lifecycle transition %s -> %s", (fromState, toState) => {
    expect(validateTruthIntegrityLifecycleTransition(fromState, toState).valid).toBe(true);
  });

  it("disallowed lifecycle transition fails", () => {
    expect(validateTruthIntegrityLifecycleTransition("ARCHIVED", "READY").valid).toBe(false);
  });
});

function compatibleTarget(integrityType: TruthIntegrityContract["integrity_type"]): TruthIntegrityContract["integrity_target"] {
  const targetTypeByIntegrityType: Record<TruthIntegrityContract["integrity_type"], TruthIntegrityContract["integrity_target"]["target_type"]> = {
    TRUTH_RECORD_INTEGRITY: "TRUTH_RECORD",
    EVENT_INTEGRITY: "EVENT",
    EVIDENCE_INTEGRITY: "EVIDENCE",
    LINEAGE_INTEGRITY: "LINEAGE_GRAPH",
    GOVERNANCE_INTEGRITY: "GOVERNANCE_DECISION",
    RECOMMENDATION_INTEGRITY: "RECOMMENDATION",
    RISK_INTEGRITY: "RISK_RECORD",
    CONFIDENCE_INTEGRITY: "CONFIDENCE_RECORD",
    REPLAY_CONTRACT_INTEGRITY: "REPLAY_CONTRACT",
    REPLAY_INPUT_BUNDLE_INTEGRITY: "REPLAY_INPUT_BUNDLE",
    REPLAY_STATE_PACKAGE_INTEGRITY: "REPLAY_STATE_PACKAGE",
    REPLAY_OUTPUT_VERIFICATION_INTEGRITY: "REPLAY_OUTPUT_VERIFICATION",
    REPLAY_DETERMINISM_GATE_INTEGRITY: "REPLAY_DETERMINISM_GATE",
    SCHEMA_INTEGRITY: "SCHEMA",
    MISSION_INTEGRITY: "MISSION",
    FULL_CONTEXT_INTEGRITY: "FULL_CONTEXT",
  };
  return { target_type: targetTypeByIntegrityType[integrityType], target_ids: [`${targetTypeByIntegrityType[integrityType].toLowerCase()}_001`] };
}
