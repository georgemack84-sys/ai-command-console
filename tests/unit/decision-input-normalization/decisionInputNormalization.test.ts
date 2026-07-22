import { describe, expect, it } from "vitest";
import {
  buildDecisionIntakeMetrics,
  createInputNormalizationRequest,
  getDecisionInputNormalizationAdapter,
  inputNormalizationRequestFromIntake,
  normalizeDecisionCandidateInput,
  normalizeInputForIntake,
  replayInputNormalization,
} from "@/services/decision-input-normalization";
import { createDecisionCandidatePayload, createDecisionIntakeRequest } from "@/services/decision-intake-engine";
import { createIntegrityVerificationRequest, verifyDecisionCandidateIntegrity } from "@/services/decision-candidate-integrity-verification";
import type { NormalizationFailureReason } from "@/types/decision-input-normalization";

describe("decision input normalization", () => {
  it("normalizes a trusted candidate into the canonical DecisionCandidate contract", () => {
    const payload = createDecisionCandidatePayload({
      candidate_id: "Candidate Alpha/001",
      decision_type: "Execution Plan",
      proposed_action: "  Recommend   operator review package. ",
      evidence_refs: ["evidence_a", "evidence_a", "evidence_z"],
      replay_refs: ["replay_a", "replay_z"],
      governance_refs: ["governance_a", "governance_z"],
    });
    const integrity = verifyDecisionCandidateIntegrity(createIntegrityVerificationRequest({ candidate_payload: payload, integrity_hash: payload.integrity_hash }));
    const result = normalizeDecisionCandidateInput(createInputNormalizationRequest({ source_payload: payload, integrity_verification: integrity }));

    expect(result.normalization_status).toBe("PASS");
    expect(result.normalization_state).toBe("PASSED");
    expect(result.candidate?.candidate_id).toBe("candidate_alpha_001");
    expect(result.candidate?.decision_type).toBe("RECOMMENDATION_SELECTION");
    expect(result.candidate?.proposed_action).toBe("Recommend operator review package.");
    expect(result.candidate?.evidence_refs).toEqual(["evidence_a", "evidence_z"]);
    expect(result.candidate?.governance_refs).toEqual(["governance_a", "governance_z"]);
    expect(result.candidate?.replay_refs).toEqual(["replay_a", "replay_z"]);
    expect(result.candidate?.advisory_only).toBe(true);
    expect(result.candidate?.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.candidate_record?.duplicate_status).toBe("NEW");
    expect(result.intake_record.validation_result).toBe("ACCEPTED");
    expect(result.forwarded_to_orchestration).toBe(true);
  });

  it("produces deterministic normalized candidates and replay output", () => {
    const request = createInputNormalizationRequest();
    const first = normalizeDecisionCandidateInput(request);
    const second = normalizeDecisionCandidateInput(request);
    const replay = replayInputNormalization(first);

    expect(second.candidate).toEqual(first.candidate);
    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_state).toBe("PASSED");
  });

  it.each<[
    string,
    Parameters<typeof createInputNormalizationRequest>[0],
    NormalizationFailureReason,
  ]>([
    ["integrity failure", { integrity_verification: verifyDecisionCandidateIntegrity(createIntegrityVerificationRequest({ integrity_hash: "0".repeat(64) })) }, "INTEGRITY_VERIFICATION_FAILED"],
    ["tenant mismatch", { tenant_id: "tenant_beta" }, "TENANT_MISMATCH"],
    ["missing evidence", { source_payload: createDecisionCandidatePayload({ evidence_refs: [] }) }, "MALFORMED_PAYLOAD"],
    ["governance omission", { source_payload: createDecisionCandidatePayload({ governance_refs: [] }) }, "GOVERNANCE_OMISSION"],
    ["replay mismatch", { source_payload: createDecisionCandidatePayload({ replay_refs: [] }) }, "REPLAY_MISMATCH"],
    ["authority violation", { source_payload: createDecisionCandidatePayload({ authority_metadata: { authority_level: "ADVISORY", advisory_only: true, execution_authorized: true, requested_operations: ["execute"] } }) }, "AUTHORITY_VIOLATION"],
    ["advisory-only violation", { source_payload: createDecisionCandidatePayload({ authority_metadata: { authority_level: "ADVISORY", advisory_only: false, execution_authorized: false, requested_operations: ["recommend"] } }) }, "ADVISORY_ONLY_VIOLATION"],
  ])("fails closed for %s", (_name, override, failure) => {
    const result = normalizeDecisionCandidateInput(createInputNormalizationRequest(override));

    expect(result.normalization_status).toBe("FAIL");
    expect(result.failure_reason).toBe(failure);
    expect(result.failure_reasons).toEqual([failure]);
    expect(result.candidate).toBeUndefined();
    expect(result.candidate_record).toBeUndefined();
    expect(result.forwarded_to_orchestration).toBe(false);
    expect(result.intake_record.validation_result).toBe("REJECTED");
    expect(result.audit_records.at(-1)?.audit_event).toBe("NORMALIZATION_REJECTED");
  });

  it("registers duplicate candidates without forwarding duplicate orchestration", () => {
    const first = normalizeDecisionCandidateInput();
    const second = normalizeDecisionCandidateInput(createInputNormalizationRequest({
      existing_registry: first.candidate_record ? [first.candidate_record] : [],
    }));

    expect(second.normalization_status).toBe("PASS");
    expect(second.duplicate_record?.duplicate_status).toBe("DUPLICATE");
    expect(second.duplicate_record?.matched_candidate_id).toBe(first.candidate?.candidate_id);
    expect(second.duplicate_record?.orchestration_blocked).toBe(true);
    expect(second.forwarded_to_orchestration).toBe(false);
    expect(second.registry_size).toBe(2);
  });

  it("adapts intake requests into normalization", () => {
    const intake = createDecisionIntakeRequest();
    const request = inputNormalizationRequestFromIntake(intake);
    const bridge = normalizeInputForIntake(intake);

    expect(request.normalization_id).toBe(`normalization_${intake.request_id}`);
    expect(request.integrity_verification?.verification_status).toBe("PASS");
    expect(bridge.normalization.normalization_status).toBe("PASS");
    expect(bridge.normalization_allowed).toBe(true);
    expect(bridge.intake_failure_reasons).toEqual([]);
  });

  it("maps normalization failures to intake rejection reasons", () => {
    const intake = createDecisionIntakeRequest({
      candidate_payload: createDecisionCandidatePayload({
        authority_metadata: { authority_level: "ADVISORY", advisory_only: false, execution_authorized: false, requested_operations: ["recommend"] },
      }),
    });
    const bridge = normalizeInputForIntake(intake);

    expect(bridge.normalization.normalization_status).toBe("FAIL");
    expect(bridge.normalization_allowed).toBe(false);
    expect(bridge.intake_failure_reasons).toContain("ADVISORY_ONLY_VIOLATION");
  });

  it("emits intake normalization metrics", () => {
    const pass = normalizeDecisionCandidateInput();
    const duplicate = normalizeDecisionCandidateInput(createInputNormalizationRequest({ existing_registry: pass.candidate_record ? [pass.candidate_record] : [] }));
    const rejected = normalizeDecisionCandidateInput(createInputNormalizationRequest({ tenant_id: "tenant_beta" }));

    const metrics = buildDecisionIntakeMetrics([pass, duplicate, rejected]);

    expect(metrics.candidates_received).toBe(3);
    expect(metrics.accepted_candidates).toBe(2);
    expect(metrics.rejected_candidates).toBe(1);
    expect(metrics.duplicate_rate).toBeGreaterThan(0);
    expect(metrics.replay_validation_success).toBe(1);
    expect(metrics.registry_growth).toBe(2);
    expect(metrics.subsystem_distribution["mission-control-operator-console"]).toBe(3);
  });

  it("exposes the normalization adapter package", () => {
    const adapter = getDecisionInputNormalizationAdapter();

    expect(adapter.normalization_order).toContain("LEDGER_RECORDED");
    expect(adapter.normalization.normalization_status).toBe("PASS");
    expect(adapter.intake_bridge.normalization_allowed).toBe(true);
    expect(adapter.integrity_bridge.intake_allowed).toBe(true);
    expect(adapter.replay.replay_valid).toBe(true);
    expect(adapter.metrics.candidates_received).toBe(1);
  });
});
