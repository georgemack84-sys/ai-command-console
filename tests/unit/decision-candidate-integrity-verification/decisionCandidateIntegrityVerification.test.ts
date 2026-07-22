import { describe, expect, it } from "vitest";
import {
  buildIntegrityVerificationObservability,
  computeCandidateCanonicalHash,
  createIntegrityVerificationRequest,
  getDecisionCandidateIntegrityVerificationEngine,
  integrityVerificationRequestFromIntake,
  replayIntegrityVerification,
  verifyDecisionCandidateIntegrity,
  verifyIntegrityForIntake,
} from "@/services/decision-candidate-integrity-verification";
import { createDecisionCandidatePayload, createDecisionIntakeRequest } from "@/services/decision-intake-engine";
import { createSchemaValidationRequest, validateDecisionCandidateSchema } from "@/services/decision-candidate-schema-validation";
import type { IntegrityVerificationFailureReason, IntegrityVerificationState } from "@/types/decision-candidate-integrity-verification";

function requestWith(overrides: Parameters<typeof createIntegrityVerificationRequest>[0] = {}) {
  return createIntegrityVerificationRequest(overrides);
}

describe("decision candidate integrity verification", () => {
  it("passes a schema-valid candidate with reproducible integrity evidence", () => {
    const result = verifyDecisionCandidateIntegrity();

    expect(result.verification_status).toBe("PASS");
    expect(result.verification_state).toBe("PASSED");
    expect(result.downstream_allowed).toBe(true);
    expect(result.canonical_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.hash_record.hash_match).toBe(true);
    expect(result.replay_status).toBe("PASS");
    expect(result.lineage_status).toBe("PASS");
    expect(result.evidence_status).toBe("PASS");
    expect(result.governance_status).toBe("PASS");
    expect(result.ledger_record.ledger_event).toBe("INTEGRITY_VERIFICATION_PASSED");
    expect(result.audit_records.map((record) => record.event_type)).toEqual([
      "CANONICAL_PAYLOAD_GENERATED",
      "HASH_VERIFIED",
      "REPLAY_REFERENCES_CHECKED",
      "LINEAGE_REFERENCES_CHECKED",
      "EVIDENCE_CONSISTENCY_CHECKED",
      "GOVERNANCE_REFERENCES_CHECKED",
      "INTEGRITY_VERIFICATION_PASSED",
    ]);
  });

  it.each<[
    string,
    Parameters<typeof createIntegrityVerificationRequest>[0],
    IntegrityVerificationFailureReason,
    IntegrityVerificationState,
  ]>([
    ["schema validation failure", { schema_validation: validateDecisionCandidateSchema(createSchemaValidationRequest({ raw_candidate_payload: [] })) }, "SCHEMA_VALIDATION_FAILED", "FAILED_CANONICALIZATION"],
    ["unstable reference order", { replay_refs: ["replay_z", "replay_a"] }, "UNSTABLE_REFERENCE_ORDER", "FAILED_CANONICALIZATION"],
    ["missing integrity hash", { integrity_hash: undefined }, "MISSING_INTEGRITY_HASH", "FAILED_HASH"],
    ["invalid hash format", { integrity_hash: "not-a-hash" }, "INVALID_HASH_FORMAT", "FAILED_HASH"],
    ["hash mismatch", { integrity_hash: "0".repeat(64) }, "HASH_MISMATCH", "FAILED_HASH"],
    ["unsupported hash algorithm", { hash_algorithm: "MD5" as "SHA-256" }, "UNSUPPORTED_HASH_ALGORITHM", "FAILED_HASH"],
    ["missing replay reference", { replay_refs: [] }, "MISSING_REPLAY_REFERENCE", "FAILED_REPLAY"],
    ["unresolved replay reference", { replay_refs: ["replay_unresolved_tenant_alpha_mission_phase_9_decision_orchestration_001"] }, "UNRESOLVED_REPLAY_REFERENCE", "FAILED_REPLAY"],
    ["replay version mismatch", { replay_refs: ["replay_tenant_alpha_mission_phase_9_decision_orchestration_v999"] }, "REPLAY_VERSION_MISMATCH", "FAILED_REPLAY"],
    ["missing lineage reference", { lineage_refs: [] }, "MISSING_LINEAGE_REFERENCE", "FAILED_LINEAGE"],
    ["broken lineage chain", { lineage_refs: ["lineage_broken_tenant_alpha_mission_phase_9_decision_orchestration_001"] }, "BROKEN_LINEAGE_CHAIN", "FAILED_LINEAGE"],
    ["unresolved evidence", { evidence_refs: ["evidence_unresolved_tenant_alpha_mission_phase_9_decision_orchestration_001"] }, "UNRESOLVED_EVIDENCE", "FAILED_EVIDENCE"],
    ["cross tenant evidence", { evidence_refs: ["evidence_tenant_beta_mission_phase_9_decision_orchestration_001"] }, "CROSS_TENANT_EVIDENCE", "FAILED_EVIDENCE"],
    ["unrelated mission evidence", { evidence_refs: ["evidence_tenant_alpha_mission_archived_001"] }, "UNRELATED_MISSION_EVIDENCE", "FAILED_EVIDENCE"],
    ["missing governance reference", { governance_refs: [] }, "MISSING_GOVERNANCE_REFERENCE", "FAILED_GOVERNANCE"],
    ["unresolved governance reference", { governance_refs: ["governance_unresolved_tenant_alpha_mission_phase_9_decision_orchestration_001"] }, "UNRESOLVED_POLICY_REFERENCE", "FAILED_GOVERNANCE"],
  ])("fails closed for %s", (_name, override, failure, state) => {
    const result = verifyDecisionCandidateIntegrity(requestWith(override));

    expect(result.verification_status).toBe("FAIL");
    expect(result.verification_state).toBe(state);
    expect(result.failed_stage).toBe(state);
    expect(result.failure_reason).toBe(failure);
    expect(result.failure_reasons).toEqual([failure]);
    expect(result.downstream_allowed).toBe(false);
    expect(result.ledger_record.ledger_event).toBe("INTEGRITY_VERIFICATION_FAILED");
    expect(result.audit_records.at(-1)?.event_type).toBe("INTAKE_REJECTED");
  });

  it("rejects governance approval candidates without constitutional linkage", () => {
    const candidate = createDecisionCandidatePayload({
      authority_metadata: {
        authority_level: "GOVERNANCE_APPROVAL_REQUIRED",
        advisory_only: true,
        execution_authorized: false,
        requested_operations: ["recommend"],
      },
    });
    const result = verifyDecisionCandidateIntegrity(requestWith({ candidate_payload: candidate, integrity_hash: computeCandidateCanonicalHash(candidate) }));

    expect(result.verification_status).toBe("FAIL");
    expect(result.failure_reason).toBe("CONSTITUTIONAL_REFERENCE_OMISSION");
    expect(result.governance_record.constitutional_reference_status).toBe("FAIL");
  });

  it("adapts intake requests into integrity verification", () => {
    const intake = createDecisionIntakeRequest();
    const request = integrityVerificationRequestFromIntake(intake);
    const bridge = verifyIntegrityForIntake(intake);

    expect(request.verification_id).toBe(`integrity_verification_${intake.request_id}`);
    expect(request.schema_validation?.validation_status).toBe("PASS");
    expect(bridge.integrity_verification.verification_status).toBe("PASS");
    expect(bridge.intake_allowed).toBe(true);
    expect(bridge.intake_failure_reasons).toEqual([]);
  });

  it("maps integrity failures back to intake rejection reasons", () => {
    const intake = createDecisionIntakeRequest({
      candidate_payload: createDecisionCandidatePayload({ integrity_hash: "0".repeat(64) }),
    });
    const bridge = verifyIntegrityForIntake(intake);

    expect(bridge.integrity_verification.failure_reason).toBe("HASH_MISMATCH");
    expect(bridge.intake_allowed).toBe(false);
    expect(bridge.intake_failure_reasons).toContain("HASH_MISMATCH");
  });

  it("replays integrity verification deterministically", () => {
    const result = verifyDecisionCandidateIntegrity();
    const replay = replayIntegrityVerification(result);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_state).toBe("PASSED");
    expect(replay.failures).toEqual([]);
  });

  it("emits observability metrics across failure classes", () => {
    const pass = verifyDecisionCandidateIntegrity();
    const hashFailure = verifyDecisionCandidateIntegrity(requestWith({ integrity_hash: "0".repeat(64) }));
    const replayFailure = verifyDecisionCandidateIntegrity(requestWith({ replay_refs: [] }));
    const lineageFailure = verifyDecisionCandidateIntegrity(requestWith({ lineage_refs: [] }));
    const evidenceFailure = verifyDecisionCandidateIntegrity(requestWith({ evidence_refs: ["evidence_tenant_beta_mission_phase_9_decision_orchestration_001"] }));
    const governanceFailure = verifyDecisionCandidateIntegrity(requestWith({ governance_refs: [] }));

    const observability = buildIntegrityVerificationObservability([pass, hashFailure, replayFailure, lineageFailure, evidenceFailure, governanceFailure]);

    expect(observability.integrity_verification_attempts).toBe(6);
    expect(observability.integrity_verification_passes).toBe(1);
    expect(observability.integrity_verification_failures).toBe(5);
    expect(observability.hash_mismatch_count).toBeGreaterThan(0);
    expect(observability.replay_reference_failures).toBeGreaterThan(0);
    expect(observability.lineage_failures).toBeGreaterThan(0);
    expect(observability.evidence_consistency_failures).toBeGreaterThan(0);
    expect(observability.governance_reference_failures).toBeGreaterThan(0);
    expect(observability.cross_tenant_reference_failures).toBeGreaterThan(0);
  });

  it("exposes the integrity verification engine package", () => {
    const engine = getDecisionCandidateIntegrityVerificationEngine();

    expect(engine.verification_order).toContain("GOVERNANCE_VERIFIED");
    expect(engine.verification.verification_status).toBe("PASS");
    expect(engine.intake_bridge.intake_allowed).toBe(true);
    expect(engine.replay.replay_valid).toBe(true);
    expect(engine.observability.integrity_verification_attempts).toBe(1);
  });
});
