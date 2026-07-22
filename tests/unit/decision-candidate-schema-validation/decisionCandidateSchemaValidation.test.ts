import { describe, expect, it } from "vitest";
import {
  buildCandidateSchemaObservability,
  createSchemaValidationRequest,
  getDecisionCandidateSchemaValidationEngine,
  replaySchemaValidation,
  schemaValidationRequestFromIntake,
  validateDecisionCandidateSchema,
  validateSchemaForIntake,
} from "@/services/decision-candidate-schema-validation";
import { createDecisionCandidatePayload, createDecisionIntakeRequest } from "@/services/decision-intake-engine";
import type { CandidateSchemaFailureReason, CandidateSchemaValidationState } from "@/types/decision-candidate-schema-validation";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    ...createDecisionCandidatePayload(),
    source_system: "mission-control-operator-console",
    source_record_ref: "source_record_tenant_alpha_mission_phase_9_decision_orchestration_001",
    ...overrides,
  };
}

describe("decision candidate schema validation", () => {
  it("passes a structurally complete candidate in deterministic order", () => {
    const result = validateDecisionCandidateSchema(createSchemaValidationRequest({ raw_candidate_payload: validPayload() }));

    expect(result.validation_status).toBe("PASS");
    expect(result.validation_state).toBe("PASSED");
    expect(result.downstream_allowed).toBe(true);
    expect(result.lineage_status).toBe("COMPLETE");
    expect(result.audit_records.map((record) => record.validation_stage)).toEqual(["STRUCTURE_VALIDATED", "FIELDS_VALIDATED", "IDENTIFIERS_VALIDATED", "REFERENCES_VALIDATED", "LINEAGE_VALIDATED", "SERIALIZATION_VALIDATED", "PASSED"]);
    expect(result.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it.each<[
    string,
    Record<string, unknown>,
    CandidateSchemaFailureReason,
    CandidateSchemaValidationState,
  ]>([
    ["source_system", { source_system: undefined }, "MISSING_SOURCE_SYSTEM", "FAILED_REQUIRED_FIELDS"],
    ["tenant_id", { tenant_id: undefined }, "MISSING_TENANT_ID", "FAILED_REQUIRED_FIELDS"],
    ["mission_id", { mission_id: undefined }, "MISSING_MISSION_ID", "FAILED_REQUIRED_FIELDS"],
    ["decision_type", { decision_type: undefined }, "MISSING_DECISION_TYPE", "FAILED_REQUIRED_FIELDS"],
    ["proposed_action", { proposed_action: undefined }, "MISSING_PROPOSED_ACTION", "FAILED_REQUIRED_FIELDS"],
    ["evidence_refs", { evidence_refs: undefined }, "MISSING_EVIDENCE_REFS", "FAILED_REQUIRED_FIELDS"],
    ["replay_refs", { replay_refs: undefined }, "MISSING_REPLAY_REFS", "FAILED_REQUIRED_FIELDS"],
    ["empty proposed_action", { proposed_action: "" }, "EMPTY_REQUIRED_FIELD", "FAILED_REQUIRED_FIELDS"],
  ])("fails for missing or empty %s", (_field, override, failure, state) => {
    const result = validateDecisionCandidateSchema(createSchemaValidationRequest({ raw_candidate_payload: validPayload(override) }));

    expect(result.validation_status).toBe("FAIL");
    expect(result.validation_state).toBe(state);
    expect(result.failure_reasons).toContain(failure);
    expect(result.downstream_allowed).toBe(false);
  });

  it.each<[
    string,
    unknown,
    CandidateSchemaFailureReason,
    CandidateSchemaValidationState,
  ]>([
    ["array root", [], "MALFORMED_OBJECT", "FAILED_STRUCTURE"],
    ["null root", null, "MALFORMED_OBJECT", "FAILED_STRUCTURE"],
    ["hidden executable key", validPayload({ execute_command: "deploy" }), "HIDDEN_EXECUTABLE_LOGIC", "FAILED_STRUCTURE"],
    ["unsupported undefined field", validPayload({ optional_marker: undefined }), "UNSUPPORTED_FIELD_TYPE", "FAILED_STRUCTURE"],
  ])("fails closed for malformed structure: %s", (_name, payload, failure, state) => {
    const result = validateDecisionCandidateSchema(createSchemaValidationRequest({ raw_candidate_payload: payload }));

    expect(result.validation_status).toBe("FAIL");
    expect(result.validation_state).toBe(state);
    expect(result.failure_reasons).toContain(failure);
  });

  it.each<[
    string,
    Record<string, unknown>,
    CandidateSchemaFailureReason,
  ]>([
    ["malformed source id", { source_system: "bad source" }, "NON_CANONICAL_IDENTIFIER"],
    ["unstable candidate id", { candidate_id: "candidate_random_123" }, "UNSTABLE_IDENTIFIER"],
    ["invalid evidence ref", { evidence_refs: ["bad ref"], replay_refs: ["replay_a"] }, "INVALID_EVIDENCE_REF"],
    ["invalid replay ref", { evidence_refs: ["evidence_a"], replay_refs: ["bad ref"] }, "INVALID_REPLAY_REF"],
    ["duplicate refs", { evidence_refs: ["evidence_a", "evidence_a"], replay_refs: ["replay_a"] }, "DUPLICATE_REFERENCE"],
    ["non deterministic reference ordering", { evidence_refs: ["evidence_z", "evidence_a"], replay_refs: ["replay_a"] }, "REFERENCE_ORDER_NONDETERMINISTIC"],
  ])("rejects %s", (_name, override, failure) => {
    const result = validateDecisionCandidateSchema(createSchemaValidationRequest({ raw_candidate_payload: validPayload(override) }));

    expect(result.validation_status).toBe("FAIL");
    expect(result.failure_reasons).toContain(failure);
    expect(result.downstream_allowed).toBe(false);
  });

  it("rejects incomplete lineage before normalization", () => {
    const result = validateDecisionCandidateSchema(createSchemaValidationRequest({
      raw_candidate_payload: validPayload({ source_record_id: undefined, source_record_ref: undefined, lineage_refs: [] }),
    }));

    expect(result.validation_status).toBe("FAIL");
    expect(result.validation_state).toBe("FAILED_LINEAGE");
    expect(result.failure_reasons).toContain("INCOMPLETE_LINEAGE");
    expect(result.failure_reasons).toContain("MISSING_SOURCE_RECORD");
    expect(result.lineage_status).toBe("INCOMPLETE");
  });

  it("rejects nondeterministic serialization markers", () => {
    const result = validateDecisionCandidateSchema(createSchemaValidationRequest({
      raw_candidate_payload: validPayload({ rationale_summary: "generated by Date.now" }),
    }));

    expect(result.validation_status).toBe("FAIL");
    expect(result.validation_state).toBe("FAILED_SERIALIZATION");
    expect(result.failure_reasons).toContain("NONDETERMINISTIC_FIELD");
  });

  it("adapts intake requests into schema validation", () => {
    const intake = createDecisionIntakeRequest();
    const request = schemaValidationRequestFromIntake(intake);
    const bridge = validateSchemaForIntake(intake);

    expect(request.intake_id).toBe(`intake_${intake.request_id}`);
    expect(bridge.schema_validation.validation_status).toBe("PASS");
    expect(bridge.intake_allowed).toBe(true);
    expect(bridge.intake_failure_reasons).toEqual([]);
  });

  it("maps schema failures to intake failure reasons", () => {
    const intake = createDecisionIntakeRequest({
      candidate_payload: createDecisionCandidatePayload({ evidence_refs: [] }),
    });
    const bridge = validateSchemaForIntake(intake);

    expect(bridge.schema_validation.validation_status).toBe("FAIL");
    expect(bridge.intake_allowed).toBe(false);
    expect(bridge.intake_failure_reasons).toContain("MISSING_EVIDENCE_REFERENCES");
  });

  it("replays schema validation deterministically", () => {
    const result = validateDecisionCandidateSchema();
    const replay = replaySchemaValidation(result);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_state).toBe("PASSED");
  });

  it("emits schema observability metrics", () => {
    const pass = validateDecisionCandidateSchema();
    const missing = validateDecisionCandidateSchema(createSchemaValidationRequest({ raw_candidate_payload: validPayload({ source_system: undefined }) }));
    const malformed = validateDecisionCandidateSchema(createSchemaValidationRequest({ raw_candidate_payload: [] }));
    const refs = validateDecisionCandidateSchema(createSchemaValidationRequest({ raw_candidate_payload: validPayload({ replay_refs: ["bad ref"] }) }));
    const lineage = validateDecisionCandidateSchema(createSchemaValidationRequest({ raw_candidate_payload: validPayload({ lineage_refs: [] }) }));

    const observability = buildCandidateSchemaObservability([pass, missing, malformed, refs, lineage]);

    expect(observability.schema_validation_attempts).toBe(5);
    expect(observability.schema_validation_passes).toBe(1);
    expect(observability.schema_validation_failures).toBe(4);
    expect(observability.missing_field_failures).toBeGreaterThan(0);
    expect(observability.malformed_object_failures).toBeGreaterThan(0);
    expect(observability.invalid_reference_failures).toBeGreaterThan(0);
    expect(observability.incomplete_lineage_failures).toBeGreaterThan(0);
  });

  it("exposes the schema validation engine package", () => {
    const engine = getDecisionCandidateSchemaValidationEngine();

    expect(engine.required_fields).toContain("source_system");
    expect(engine.validation_order).toContain("SERIALIZATION_VALIDATED");
    expect(engine.validation.validation_status).toBe("PASS");
    expect(engine.intake_bridge.intake_allowed).toBe(true);
    expect(engine.replay.replay_valid).toBe(true);
  });
});
