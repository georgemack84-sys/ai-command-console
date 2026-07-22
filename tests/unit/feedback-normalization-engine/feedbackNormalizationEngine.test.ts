import { describe, expect, it } from "vitest";
import {
  getFeedbackNormalizationEngineFoundation,
  normalizeFeedback,
  replayFeedbackNormalization,
} from "@/services/feedback-normalization-engine";
import type { FeedbackNormalizationFailure, FeedbackNormalizationScenario, NormalizedFeedbackType } from "@/types/feedback-normalization-engine";

describe("Mission Control Phase 10.9.3 Feedback Normalization Engine", () => {
  it("publishes the feedback normalization foundation", () => {
    const foundation = getFeedbackNormalizationEngineFoundation();

    expect(foundation.feedback_normalization_engine_version).toBe("feedback-normalization-engine/v1");
    expect(foundation.api_surface.normalize_feedback).toBe("POST /feedback-normalization-engine/normalize");
    expect(foundation.api_surface.learning_supported).toBe(false);
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.result.normalization_state).toBe("NORMALIZED");
  });

  it("normalizes feedback deterministically", () => {
    const first = normalizeFeedback({ scenario: "RAW_EVIDENCE_WORDING" });
    const second = normalizeFeedback({ scenario: "RAW_EVIDENCE_WORDING" });

    expect(first.normalized_record?.normalized_feedback_id).toBe(second.normalized_record?.normalized_feedback_id);
    expect(first.normalized_record?.integrity_hash).toBe(second.normalized_record?.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("preserves original operator wording and lineage", () => {
    const result = normalizeFeedback({ scenario: "RAW_CLARITY_WORDING" });

    expect(result.normalized_record?.original_operator_wording).toBe("Recommendation was unclear");
    expect(result.normalized_record?.preserved_evidence_refs.length).toBeGreaterThan(0);
    expect(result.normalized_record?.preserved_replay_refs.length).toBeGreaterThan(0);
    expect(result.explanation.original_wording).toBe("Recommendation was unclear");
  });

  it.each([
    ["APPROVAL", "APPROVAL_FEEDBACK"],
    ["REJECTION", "REJECTION_FEEDBACK"],
    ["OVERRIDE", "OVERRIDE_FEEDBACK"],
    ["CLARITY", "CLARITY_FEEDBACK"],
    ["EVIDENCE", "EVIDENCE_FEEDBACK"],
    ["RISK", "RISK_FEEDBACK"],
    ["CONFIDENCE", "CONFIDENCE_FEEDBACK"],
    ["GOVERNANCE", "GOVERNANCE_FEEDBACK"],
    ["SIMULATION", "SIMULATION_FEEDBACK"],
    ["ROLLBACK", "ROLLBACK_FEEDBACK"],
  ] as readonly [FeedbackNormalizationScenario, NormalizedFeedbackType][])("maps %s to %s", (scenario, type) => {
    const result = normalizeFeedback({ scenario });

    expect(result.normalized_record?.canonical_feedback_type).toBe(type);
    expect(result.normalization_state).toBe("NORMALIZED");
  });

  it.each([
    ["RAW_EVIDENCE_WORDING", "Evidence Sufficiency Issue"],
    ["RAW_CLARITY_WORDING", "Explanation Deficiency"],
    ["RAW_RISK_LOW_WORDING", "Risk Underestimation"],
    ["RAW_CONFIDENCE_HIGH_WORDING", "Confidence Miscalibration"],
    ["RAW_GOVERNANCE_WORDING", "Governance Concern"],
    ["RAW_SIMULATION_WORDING", "Simulation Coverage Gap"],
  ] as readonly [FeedbackNormalizationScenario, string][])("maps %s to canonical issue", (scenario, issue) => {
    const result = normalizeFeedback({ scenario });

    expect(result.normalized_record?.canonical_issue).toBe(issue);
  });

  it("calibrates confidence deterministically", () => {
    const result = normalizeFeedback({ scenario: "RAW_CONFIDENCE_HIGH_WORDING" });

    expect(result.normalized_record?.normalized_confidence).toBe("HIGH");
    expect(result.explanation.confidence_calibration).toBe("HIGH");
  });

  it.each([
    ["EXACT_DUPLICATE", "EXACT_DUPLICATE_REFERENCED"],
    ["SEMANTIC_DUPLICATE", "SEMANTIC_DUPLICATE_MERGED"],
    ["INDEPENDENT_FEEDBACK", "INDEPENDENT_FEEDBACK"],
  ] as const)("resolves %s deterministically", (scenario, status) => {
    const result = normalizeFeedback({ scenario });

    expect(result.normalized_record?.duplicate_resolution_status).toBe(status);
  });

  it("records explainable audit trail", () => {
    const result = normalizeFeedback({ scenario: "RAW_EVIDENCE_WORDING" });

    expect(result.audit_events.map((event) => event.event_type)).toEqual([
      "PREPROCESSING",
      "NORMALIZATION_RULE",
      "CLASSIFICATION",
      "SEMANTIC_MAPPING",
      "DUPLICATE_RESOLUTION",
      "CONFIDENCE_CALIBRATION",
      "NORMALIZED_RECORD",
    ]);
    expect(result.explainable).toBe(true);
    expect(result.evidence_only).toBe(true);
  });

  it.each([
    ["UNSUPPORTED_FEEDBACK_CLASSIFICATION", "UNSUPPORTED_FEEDBACK_CLASSIFICATION"],
    ["MISSING_NORMALIZATION_RULE", "MISSING_NORMALIZATION_RULE"],
    ["INVALID_SEMANTIC_MAPPING_VERSION", "INVALID_SEMANTIC_MAPPING_VERSION"],
    ["CORRUPTED_FEEDBACK_RECORD", "CORRUPTED_FEEDBACK_RECORD"],
    ["REPLAY_REFERENCE_MISSING", "REPLAY_REFERENCE_MISSING"],
    ["CONFIDENCE_MAPPING_UNDEFINED", "CONFIDENCE_MAPPING_UNDEFINED"],
    ["DUPLICATE_RESOLUTION_CONFLICT", "DUPLICATE_RESOLUTION_CONFLICT"],
  ] as readonly [FeedbackNormalizationScenario, FeedbackNormalizationFailure][])("rejects %s", (scenario, failure) => {
    const result = normalizeFeedback({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.normalization_state).toBe("REJECTED");
    expect(result.normalized_record).toBeNull();
    expect(result.replayable).toBe(false);
  });

  it("rejects unaccepted intake results", () => {
    const result = normalizeFeedback({ scenario: "ANONYMOUS" });

    expect(result.failures).toContain("INTAKE_NOT_ACCEPTED");
    expect(result.normalization_state).toBe("REJECTED");
  });

  it("replays normalization output and detects tampering", () => {
    const result = normalizeFeedback({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayFeedbackNormalization(result)).toBe(true);
    expect(replayFeedbackNormalization(tampered)).toBe(false);
  });
});
