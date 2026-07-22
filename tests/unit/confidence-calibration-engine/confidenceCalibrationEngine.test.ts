import { describe, expect, it } from "vitest";
import {
  analyzeConfidenceCalibration,
  getConfidenceCalibrationFoundation,
  replayConfidenceCalibration,
} from "@/services/confidence-calibration-engine";
import type { ConfidenceCalibrationFailure, ConfidenceCalibrationScenario } from "@/types/confidence-calibration-engine";

describe("Mission Control Phase 10.6.1 Confidence Calibration Engine", () => {
  it("publishes the confidence calibration foundation", () => {
    const foundation = getConfidenceCalibrationFoundation();

    expect(foundation.confidence_calibration_engine_version).toBe("confidence-calibration-engine/v1");
    expect(foundation.api_surface.analyze_calibration).toBe("POST /confidence-calibration-engine/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("calculates confidence calibration deterministically", () => {
    const first = analyzeConfidenceCalibration();
    const second = analyzeConfidenceCalibration();

    expect(first.calibration_results[0].calibration_result_id).toBe(second.calibration_results[0].calibration_result_id);
    expect(first.scores[0].overall_score).toBe(second.scores[0].overall_score);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("classifies supported accuracy grades", () => {
    expect(analyzeConfidenceCalibration({ scenario: "EXCELLENT" }).scores[0].confidence_grade).toBe("EXCELLENT");
    expect(analyzeConfidenceCalibration({ scenario: "GOOD" }).scores[0].confidence_grade).toBe("GOOD");
    expect(analyzeConfidenceCalibration({ scenario: "ACCEPTABLE" }).scores[0].confidence_grade).toBe("ACCEPTABLE");
    expect(analyzeConfidenceCalibration({ scenario: "WEAK" }).scores[0].confidence_grade).toBe("WEAK");
    expect(analyzeConfidenceCalibration({ scenario: "POOR" }).scores[0].confidence_grade).toBe("POOR");
    expect(analyzeConfidenceCalibration({ scenario: "CRITICAL" }).scores[0].confidence_grade).toBe("CRITICAL");
  });

  it("detects overconfidence, underconfidence, and inconsistency", () => {
    expect(analyzeConfidenceCalibration({ scenario: "OVERCONFIDENT" }).calibration_results[0].confidence_bias).toBe("FALSE_CERTAINTY");
    expect(analyzeConfidenceCalibration({ scenario: "UNDERCONFIDENT" }).calibration_results[0].confidence_bias).toBe("EXCESSIVE_CAUTION");
    expect(analyzeConfidenceCalibration({ scenario: "INCONSISTENT" }).calibration_results[0].confidence_bias).toBe("INCONSISTENT");
  });

  it("records accuracy, variance, precision, consistency, uncertainty, and reliability", () => {
    const result = analyzeConfidenceCalibration().calibration_results[0];

    expect(result.calibration_accuracy).toBeGreaterThan(0);
    expect(result.confidence_variance).toBeGreaterThanOrEqual(0);
    expect(result.prediction_precision).toBeGreaterThan(0);
    expect(result.confidence_consistency).toBeGreaterThan(0);
    expect(result.uncertainty_alignment).toBeGreaterThan(0);
    expect(result.forecast_reliability).toBeGreaterThan(0);
  });

  it("generates traceable evidence and explainable reports", () => {
    const result = analyzeConfidenceCalibration();
    const evidence = result.evidence[0];
    const report = result.report;

    expect(evidence.supporting_prediction_refs.length).toBeGreaterThan(0);
    expect(evidence.supporting_outcome_refs.length).toBeGreaterThan(0);
    expect(evidence.operator_decision_refs.length).toBeGreaterThan(0);
    expect(evidence.governance_refs.length).toBeGreaterThan(0);
    expect(report.detected_biases.length).toBeGreaterThan(0);
    expect(report.governance_findings.length).toBeGreaterThan(0);
    expect(report.recommended_follow_up.length).toBeGreaterThan(0);
  });

  it("keeps calibration advisory-only and does not mutate confidence or update models", () => {
    const result = analyzeConfidenceCalibration();
    const calibration = result.calibration_results[0];

    expect(result.advisory_only).toBe(true);
    expect(result.mutates_confidence).toBe(false);
    expect(result.updates_model).toBe(false);
    expect(calibration.advisory_only).toBe(true);
    expect(calibration.mutates_confidence).toBe(false);
  });

  it("records immutable append-only confidence history registry entries", () => {
    const result = analyzeConfidenceCalibration();
    const calibration = result.calibration_results[0];
    const score = result.scores[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.calibration_result_refs).toEqual([calibration.calibration_result_id]);
    expect(result.registry.grade_index[score.confidence_grade]).toEqual([score.score_id]);
  });

  it("replays confidence calibration", () => {
    const result = analyzeConfidenceCalibration();

    expect(replayConfidenceCalibration(result)).toBe(true);
  });

  it.each([
    ["MISSING_OUTCOME", "OUTCOME_DATA_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["CONFIDENCE_MUTATION", "CONFIDENCE_VALUE_MUTATION_DETECTED"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_CALCULATION"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [ConfidenceCalibrationScenario, ConfidenceCalibrationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeConfidenceCalibration({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.updates_model).toBe(false);
  });

  it("keeps missing evidence pending instead of certified", () => {
    const result = analyzeConfidenceCalibration({ scenario: "MISSING_EVIDENCE" });

    expect(result.validation.state).toBe("PENDING_EVIDENCE");
    expect(result.validation.evidence_complete).toBe(false);
  });

  it("detects confidence calibration tampering during replay", () => {
    const result = analyzeConfidenceCalibration();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayConfidenceCalibration(tampered)).toBe(false);
  });
});
