import { describe, expect, it } from "vitest";
import {
  getOperatorFeedbackContractFoundation,
  replayOperatorFeedbackContract,
  validateOperatorFeedbackContract,
} from "@/services/operator-feedback-contract";
import type { OperatorFeedbackFailure, OperatorFeedbackScenario, OperatorFeedbackType } from "@/types/operator-feedback-contract";

describe("Mission Control Phase 10.9.1 Operator Feedback Contract", () => {
  it("publishes the canonical operator feedback contract foundation", () => {
    const foundation = getOperatorFeedbackContractFoundation();

    expect(foundation.operator_feedback_contract_version).toBe("operator-feedback-contract/v1");
    expect(foundation.api_surface.validate_feedback).toBe("POST /operator-feedback-contract/validate");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.governance_override_supported).toBe(false);
    expect(foundation.schema_fields).toContain("feedback_id");
    expect(foundation.schema_fields).toContain("governance_metadata");
  });

  it("validates baseline feedback deterministically", () => {
    const first = validateOperatorFeedbackContract({ scenario: "BASELINE" });
    const second = validateOperatorFeedbackContract({ scenario: "BASELINE" });

    expect(first.record.feedback_id).toBe(second.record.feedback_id);
    expect(first.record.integrity_hash).toBe(second.record.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.validation_state).toBe("ACCEPTED");
  });

  it("keeps feedback immutable, append-only, replayable, and evidence-only", () => {
    const result = validateOperatorFeedbackContract();

    expect(result.immutable).toBe(true);
    expect(result.append_only).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.evidence_only).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.record.governance_metadata.production_mutation_supported).toBe(false);
  });

  it.each([
    ["APPROVAL", "APPROVAL"],
    ["REJECTION", "REJECTION"],
    ["OVERRIDE", "OVERRIDE"],
    ["CLARITY", "CLARITY"],
    ["EVIDENCE", "EVIDENCE"],
    ["RISK", "RISK"],
    ["CONFIDENCE", "CONFIDENCE"],
    ["GOVERNANCE", "GOVERNANCE"],
    ["SIMULATION", "SIMULATION"],
    ["ROLLBACK", "ROLLBACK"],
  ] as readonly [OperatorFeedbackScenario, OperatorFeedbackType][])("supports %s feedback", (scenario, feedbackType) => {
    const result = validateOperatorFeedbackContract({ scenario });

    expect(result.record.feedback_type).toBe(feedbackType);
    expect(result.record.normalized_classification).toBe(feedbackType);
    expect(result.validation_state).toBe("ACCEPTED");
  });

  it("publishes the canonical vocabulary", () => {
    const result = validateOperatorFeedbackContract();

    expect(result.vocabulary.feedback_types).toEqual(["APPROVAL", "REJECTION", "OVERRIDE", "CLARITY", "EVIDENCE", "RISK", "CONFIDENCE", "GOVERNANCE", "SIMULATION", "ROLLBACK"]);
    expect(result.vocabulary.authority_scopes).toContain("OPERATOR_FEEDBACK_ONLY");
    expect(result.vocabulary.confidence_signals).toContain("APPROPRIATE");
  });

  it.each([
    ["DUPLICATE_IDENTIFIER", "DUPLICATE_IDENTIFIER"],
    ["INVALID_OPERATOR", "INVALID_OPERATOR"],
    ["MISSING_TENANT", "MISSING_TENANT"],
    ["MISSING_MISSION", "MISSING_MISSION"],
    ["MISSING_DECISION", "MISSING_DECISION"],
    ["MISSING_REPLAY_REFERENCE", "MISSING_REPLAY_REFERENCE"],
    ["INVALID_SCHEMA_VERSION", "INVALID_SCHEMA_VERSION"],
    ["INVALID_CONTRACT_VERSION", "INVALID_CONTRACT_VERSION"],
    ["MALFORMED_CLASSIFICATION", "MALFORMED_CLASSIFICATION"],
    ["CORRUPTED_INTEGRITY_HASH", "CORRUPTED_INTEGRITY_HASH"],
    ["UNAUTHORIZED_AUTHORITY_SCOPE", "UNAUTHORIZED_AUTHORITY_SCOPE"],
    ["GOVERNANCE_METADATA_OMISSION", "GOVERNANCE_METADATA_OMISSION"],
    ["CROSS_TENANT_REFERENCE", "CROSS_TENANT_REFERENCE"],
  ] as readonly [OperatorFeedbackScenario, OperatorFeedbackFailure][])("rejects %s deterministically", (scenario, failure) => {
    const result = validateOperatorFeedbackContract({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.validation_state).toBe("REJECTED");
    expect(result.replayable).toBe(false);
  });

  it("rejects malformed supplied records", () => {
    const result = validateOperatorFeedbackContract({
      record: {
        operator_id: "",
        related_replay_refs: [],
        normalized_classification: "REJECTION",
      },
    });

    expect(result.failures).toContain("INVALID_OPERATOR");
    expect(result.failures).toContain("MISSING_REPLAY_REFERENCE");
    expect(result.failures).toContain("MALFORMED_CLASSIFICATION");
    expect(result.validation_state).toBe("REJECTED");
  });

  it("replays validation output and detects tampering", () => {
    const result = validateOperatorFeedbackContract({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOperatorFeedbackContract(result)).toBe(true);
    expect(replayOperatorFeedbackContract(tampered)).toBe(false);
  });
});
