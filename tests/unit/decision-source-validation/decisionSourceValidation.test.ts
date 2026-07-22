import { describe, expect, it } from "vitest";
import {
  buildSourceValidationObservability,
  createSourceValidationRequest,
  getDecisionSourceValidationEngine,
  replaySourceValidation,
  resolveSubsystemIdentity,
  signSourceValidationRequest,
  sourceValidationRequestFromIntake,
  validateDecisionSource,
  validateSourceForIntake,
} from "@/services/decision-source-validation";
import { createDecisionCandidatePayload, createDecisionIntakeRequest } from "@/services/decision-intake-engine";
import type { SourceValidationFailureReason, SourceValidationState } from "@/types/decision-source-validation";

function signed(overrides: Parameters<typeof createSourceValidationRequest>[0]) {
  const request = createSourceValidationRequest(overrides);
  return {
    ...request,
    signature: signSourceValidationRequest({
      validation_id: request.validation_id,
      subsystem_id: request.subsystem_id,
      subsystem_version: request.subsystem_version,
      tenant_id: request.tenant_id,
      mission_id: request.mission_id,
      authority_scope: request.authority_scope,
      replay_reference: request.replay_reference,
      payload_hash: request.payload_hash,
      candidate_id: request.candidate_id,
      lineage_reference: request.lineage_reference,
      protocol_version: request.protocol_version,
    }),
  };
}

describe("decision source validation engine", () => {
  it("passes a certified registered subsystem with deterministic audit evidence", () => {
    const result = validateDecisionSource();

    expect(result.validation_status).toBe("PASS");
    expect(result.validation_state).toBe("PASSED");
    expect(result.downstream_allowed).toBe(true);
    expect(result.authority_scope_verified).toBe(true);
    expect(result.replay_compatible).toBe(true);
    expect(result.audit_records.map((record) => record.validation_stage)).toContain("REPLAY_VALIDATED");
    expect(result.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("resolves subsystem identity and certification metadata", () => {
    const request = createSourceValidationRequest();
    const subsystem = resolveSubsystemIdentity(request);

    expect(subsystem?.subsystem_id).toBe("mission-control-operator-console");
    expect(subsystem?.certification_status).toBe("CERTIFIED");
    expect(subsystem?.registration_reference).toContain("registration_");
    expect(subsystem?.certification_reference).toContain("certification_");
  });

  it.each<[
    string,
    ReturnType<typeof createSourceValidationRequest>,
    SourceValidationFailureReason,
    SourceValidationState,
  ]>([
    ["unknown subsystem", createSourceValidationRequest({ subsystem_id: "unknown-subsystem" }), "UNKNOWN_SUBSYSTEM", "FAILED_IDENTITY"],
    ["missing signature", createSourceValidationRequest({ signature: "" }), "MISSING_SIGNATURE", "FAILED_SIGNATURE"],
    ["invalid signature", createSourceValidationRequest({ signature: "invalid" }), "INVALID_SIGNATURE", "FAILED_SIGNATURE"],
    ["corrupted signature", createSourceValidationRequest({ signature: "corrupted" }), "CORRUPTED_SIGNATURE", "FAILED_SIGNATURE"],
    ["altered payload", signed({ payload_hash: "altered_payload_hash" }), "ALTERED_PAYLOAD", "FAILED_SIGNATURE"],
    ["unsupported version", signed({ subsystem_version: "9.9.9" }), "UNSUPPORTED_VERSION", "FAILED_VERSION"],
    ["deprecated interface", signed({ subsystem_version: "0.9.0" }), "UNSUPPORTED_VERSION", "FAILED_VERSION"],
    ["unknown protocol", signed({ protocol_version: "unknown" as "decision-source-validation/v1" }), "UNKNOWN_PROTOCOL", "FAILED_VERSION"],
    ["cross tenant", signed({ payload_hash: "payload_tenant_beta_reference" }), "CROSS_TENANT_SUBMISSION", "FAILED_TENANT"],
    ["unauthorized tenant", signed({ tenant_id: "tenant_beta" }), "UNAUTHORIZED_TENANT_ACCESS", "FAILED_TENANT"],
    ["unknown mission", signed({ mission_id: "mission_unknown" }), "UNAUTHORIZED_MISSION", "FAILED_MISSION"],
    ["inactive mission", signed({ mission_id: "mission_archived" }), "UNAUTHORIZED_MISSION", "FAILED_MISSION"],
    ["authority escalation", signed({ authority_scope: "EXECUTE_COMMAND" }), "INVALID_AUTHORITY_LEVEL", "FAILED_AUTHORITY"],
    ["restricted operation", signed({ authority_scope: "RESTRICTED" }), "INVALID_AUTHORITY_LEVEL", "FAILED_AUTHORITY"],
    ["missing replay", signed({ replay_reference: "" }), "MISSING_REPLAY_REFERENCE", "FAILED_REPLAY"],
    ["replay corruption", signed({ replay_reference: "replay_corrupt" }), "REPLAY_INCOMPATIBILITY", "FAILED_REPLAY"],
    ["nondeterministic id", signed({ candidate_id: "candidate_random_123" }), "NONDETERMINISTIC_IDENTIFIER", "FAILED_REPLAY"],
    ["lineage corruption", signed({ lineage_reference: "lineage_broken" }), "LINEAGE_CORRUPTION", "FAILED_REPLAY"],
  ])("fails closed for %s", (_name, request, failure, state) => {
    const result = validateDecisionSource(request);

    expect(result.validation_status).toBe("FAIL");
    expect(result.validation_state).toBe(state);
    expect(result.failure_reasons).toContain(failure);
    expect(result.downstream_allowed).toBe(false);
    expect(result.audit_records.at(-1)?.validation_result).toBe("FAIL");
  });

  it("bridges intake requests into source validation", () => {
    const intake = createDecisionIntakeRequest();
    const sourceRequest = sourceValidationRequestFromIntake(intake);
    const bridge = validateSourceForIntake(intake);

    expect(sourceRequest.subsystem_id).toBe(intake.source_system);
    expect(bridge.source_validation.validation_status).toBe("PASS");
    expect(bridge.intake_allowed).toBe(true);
    expect(bridge.intake_failure_reasons).toEqual([]);
  });

  it("maps failed source validation to intake failure reasons", () => {
    const intake = createDecisionIntakeRequest({
      source_system: "unknown-subsystem",
      candidate_payload: createDecisionCandidatePayload(),
    });
    const bridge = validateSourceForIntake(intake);

    expect(bridge.source_validation.validation_status).toBe("FAIL");
    expect(bridge.intake_allowed).toBe(false);
    expect(bridge.intake_failure_reasons).toContain("UNKNOWN_SUBSYSTEM");
  });

  it("replays validation deterministically", () => {
    const result = validateDecisionSource();
    const replay = replaySourceValidation(result);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_state).toBe("PASSED");
    expect(replay.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("emits source validation observability", () => {
    const pass = validateDecisionSource();
    const signatureFail = validateDecisionSource(createSourceValidationRequest({ signature: "invalid" }));
    const versionFail = validateDecisionSource(signed({ subsystem_version: "9.9.9" }));
    const replayFail = validateDecisionSource(signed({ replay_reference: "replay_corrupt" }));

    const observability = buildSourceValidationObservability([pass, signatureFail, versionFail, replayFail]);

    expect(observability.validation_requests).toBe(4);
    expect(observability.successful_validations).toBe(1);
    expect(observability.failed_validations).toBe(3);
    expect(observability.signature_failures).toBeGreaterThan(0);
    expect(observability.version_mismatches).toBeGreaterThan(0);
    expect(observability.replay_compatibility_failures).toBeGreaterThan(0);
  });

  it("exposes the source validation engine package", () => {
    const engine = getDecisionSourceValidationEngine();

    expect(engine.registered_subsystems.length).toBeGreaterThan(0);
    expect(engine.certifications.length).toBeGreaterThan(0);
    expect(engine.validation.validation_status).toBe("PASS");
    expect(engine.intake_bridge.intake_allowed).toBe(true);
    expect(engine.replay.replay_valid).toBe(true);
  });
});
