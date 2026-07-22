import { describe, expect, it } from "vitest";
import {
  computeDetectedPatternHash,
  detectPatterns,
  getPatternDetectionFoundation,
  replayPatternDetection,
} from "@/services/pattern-detection-engine";
import type { PatternDetectionFailure, PatternDetectionScenario } from "@/types/pattern-detection-engine";

describe("Mission Control Phase 10.4.3 Pattern Detection Engine", () => {
  it("publishes the pattern detection engine foundation", () => {
    const foundation = getPatternDetectionFoundation();

    expect(foundation.pattern_detection_engine_version).toBe("pattern-detection-engine/v1");
    expect(foundation.api_surface.detect_patterns).toBe("POST /pattern-detection-engine/detect");
    expect(foundation.result.validation.state).toBe("READY_FOR_VALIDATION");
  });

  it("detects deterministic advisory pattern intelligence from candidates", () => {
    const result = detectPatterns();
    const pattern = result.detected_patterns[0];

    expect(pattern.pattern_classification).toBe("RECOMMENDATION_FAILURE_PATTERN");
    expect(pattern.advisory_only).toBe(true);
    expect(pattern.predicts_future_behavior).toBe(false);
    expect(pattern.adaptive_learning).toBe(false);
    expect(result.predicts_future_behavior).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
  });

  it.each([
    ["RECOMMENDATION_SUCCESS", "RECOMMENDATION_SUCCESS_PATTERN"],
    ["RISK_UNDERESTIMATION", "RISK_UNDERESTIMATION_PATTERN"],
    ["RISK_OVERESTIMATION", "RISK_OVERESTIMATION_PATTERN"],
    ["CONFIDENCE_DRIFT", "CONFIDENCE_DRIFT_PATTERN"],
    ["GOVERNANCE_BLOCKER", "GOVERNANCE_BLOCKER_PATTERN"],
    ["OPERATOR_OVERRIDE", "OPERATOR_OVERRIDE_PATTERN"],
    ["EVIDENCE_GAP", "EVIDENCE_GAP_PATTERN"],
    ["MISSION_BOTTLENECK", "MISSION_BOTTLENECK_PATTERN"],
    ["DEPENDENCY_CONFLICT", "DEPENDENCY_CONFLICT_PATTERN"],
    ["SIMULATION_ERROR", "SIMULATION_ERROR_PATTERN"],
    ["ROLLBACK", "ROLLBACK_PATTERN"],
    ["STRATEGIC_OPPORTUNITY", "STRATEGIC_OPPORTUNITY_PATTERN"],
    ["LOW_CONFIDENCE", "LOW_CONFIDENCE_PATTERN"],
  ] as const)("classifies %s deterministically", (scenario, classification) => {
    const result = detectPatterns({ scenario });

    expect(result.detected_patterns[0].pattern_classification).toBe(classification);
    expect(result.rules[0].classification_mapping).toBe(classification);
  });

  it("creates immutable detected pattern identities and explanations", () => {
    const result = detectPatterns();
    const pattern = result.detected_patterns[0];

    expect(computeDetectedPatternHash(pattern)).toBe(pattern.integrity_hash);
    expect(pattern.immutable).toBe(true);
    expect(pattern.explanation).toContain(pattern.supporting_candidate_refs[0]);
    expect(pattern.detection_rule_version).toBe("pattern-detection-rule/v1");
  });

  it("registers detected patterns in an append-only registry", () => {
    const result = detectPatterns();
    const pattern = result.detected_patterns[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.detected_pattern_refs).toEqual([pattern.pattern_id]);
    expect(result.registry.classification_index[pattern.pattern_classification]).toEqual([pattern.pattern_id]);
  });

  it("validates replay, governance, tenant isolation, explanations, and integrity", () => {
    const result = detectPatterns();

    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.governance_preserved).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.explanations_complete).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
    expect(replayPatternDetection(result)).toBe(true);
  });

  it.each([
    ["INVALID_CANDIDATE", "CANDIDATE_BUILDER_INVALID"],
    ["MISSING_EVIDENCE", "REQUIRED_EVIDENCE_MISSING"],
    ["LOW_RECURRENCE", "RECURRENCE_THRESHOLD_UNMET"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_INCOMPLETE"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_RULE_VIOLATED"],
    ["UNSUPPORTED_PATTERN", "UNSUPPORTED_PATTERN_TYPE"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["CROSS_TENANT", "TENANT_BOUNDARY_VIOLATED"],
    ["MISSING_EXPLANATION", "EXPLANATION_MISSING"],
    ["RANDOMNESS", "RANDOMNESS_DETECTED"],
    ["HIDDEN_OPTIMIZATION", "HIDDEN_OPTIMIZATION_DETECTED"],
    ["AUTONOMOUS_LEARNING", "AUTONOMOUS_LEARNING_DETECTED"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [PatternDetectionScenario, PatternDetectionFailure][])("fails closed for %s", (scenario, failure) => {
    const result = detectPatterns({ scenario });

    expect(result.validation.valid).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.adaptive_learning).toBe(false);
  });

  it("keeps missing evidence pending instead of ready", () => {
    const result = detectPatterns({ scenario: "MISSING_EVIDENCE" });

    expect(result.validation.state).toBe("PENDING_EVIDENCE");
    expect(result.validation.evidence_complete).toBe(false);
  });

  it("detects pattern detection tampering during replay", () => {
    const result = detectPatterns();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayPatternDetection(tampered)).toBe(false);
  });
});
