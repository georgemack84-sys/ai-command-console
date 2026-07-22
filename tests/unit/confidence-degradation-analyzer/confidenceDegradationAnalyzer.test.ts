import { describe, expect, it } from "vitest";
import {
  analyzeConfidenceDegradation,
  getConfidenceDegradationFoundation,
  replayConfidenceDegradation,
} from "@/services/confidence-degradation-analyzer";
import type { ConfidenceDegradationFailure, ConfidenceDegradationScenario } from "@/types/confidence-degradation-analyzer";

describe("Mission Control Phase 10.6.4 Confidence Degradation Analyzer", () => {
  it("publishes the confidence degradation foundation", () => {
    const foundation = getConfidenceDegradationFoundation();

    expect(foundation.confidence_degradation_analyzer_version).toBe("confidence-degradation-analyzer/v1");
    expect(foundation.api_surface.analyze_degradation).toBe("POST /confidence-degradation-analyzer/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("analyzes confidence degradation deterministically", () => {
    const first = analyzeConfidenceDegradation({ scenario: "HIGH" });
    const second = analyzeConfidenceDegradation({ scenario: "HIGH" });

    expect(first.degradation_records[0].degradation_id).toBe(second.degradation_records[0].degradation_id);
    expect(first.trend_history.confidence_stability).toBe(second.trend_history.confidence_stability);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("classifies supported degradation severity levels", () => {
    expect(analyzeConfidenceDegradation({ scenario: "NONE" }).degradation_records[0].severity).toBe("NONE");
    expect(analyzeConfidenceDegradation({ scenario: "LOW" }).degradation_records[0].severity).toBe("LOW");
    expect(analyzeConfidenceDegradation({ scenario: "MODERATE" }).degradation_records[0].severity).toBe("MODERATE");
    expect(analyzeConfidenceDegradation({ scenario: "HIGH" }).degradation_records[0].severity).toBe("HIGH");
    expect(analyzeConfidenceDegradation({ scenario: "CRITICAL" }).degradation_records[0].severity).toBe("CRITICAL");
  });

  it("detects all required confidence degradation patterns", () => {
    expect(analyzeConfidenceDegradation({ scenario: "INFLATION" }).degradation_records[0].degradation_type).toBe("CONFIDENCE_INFLATION");
    expect(analyzeConfidenceDegradation({ scenario: "COLLAPSE" }).degradation_records[0].degradation_type).toBe("CONFIDENCE_COLLAPSE");
    expect(analyzeConfidenceDegradation({ scenario: "OSCILLATION" }).degradation_records[0].degradation_type).toBe("CONFIDENCE_OSCILLATION");
    expect(analyzeConfidenceDegradation({ scenario: "INCONSISTENCY" }).degradation_records[0].degradation_type).toBe("CONFIDENCE_INCONSISTENCY");
    expect(analyzeConfidenceDegradation({ scenario: "AGING_MODEL" }).degradation_records[0].degradation_type).toBe("AGING_MODEL");
    expect(analyzeConfidenceDegradation({ scenario: "EVIDENCE_DECAY" }).degradation_records[0].degradation_type).toBe("EVIDENCE_DECAY");
    expect(analyzeConfidenceDegradation({ scenario: "REPEATED_FAILURE" }).degradation_records[0].degradation_type).toBe("REPEATED_PREDICTION_FAILURE");
    expect(analyzeConfidenceDegradation({ scenario: "SATURATION" }).degradation_records[0].degradation_type).toBe("CONFIDENCE_SATURATION");
  });

  it("records degradation metrics, failure patterns, and trend history", () => {
    const result = analyzeConfidenceDegradation({ scenario: "CRITICAL" });
    const record = result.degradation_records[0];
    const pattern = result.failure_patterns[0];

    expect(record.confidence_accuracy_delta).toBeGreaterThan(0);
    expect(record.degradation_duration_days).toBeGreaterThan(0);
    expect(record.degradation_frequency).toBeGreaterThan(0);
    expect(pattern.root_cause_summary).toContain(record.degradation_type);
    expect(result.trend_history.degradation_events).toContain(record.degradation_id);
    expect(result.trend_history.confidence_stability).toBeLessThan(0.5);
  });

  it("builds explainable reports and immutable registry indexes", () => {
    const result = analyzeConfidenceDegradation({ scenario: "HIGH" });
    const record = result.degradation_records[0];

    expect(result.report.detected_patterns).toContain(record.degradation_type);
    expect(result.report.governance_findings.length).toBeGreaterThan(0);
    expect(result.report.recommended_follow_up.length).toBeGreaterThan(0);
    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.severity_index.HIGH).toContain(record.degradation_id);
    expect(result.registry.type_index[record.degradation_type]).toContain(record.degradation_id);
  });

  it("keeps degradation analysis advisory-only without model, governance, adaptation, or history mutation", () => {
    const result = analyzeConfidenceDegradation({ scenario: "CRITICAL" });
    const record = result.degradation_records[0];

    expect(result.advisory_only).toBe(true);
    expect(result.mutates_confidence).toBe(false);
    expect(result.updates_confidence_model).toBe(false);
    expect(result.changes_governance_requirements).toBe(false);
    expect(result.triggers_adaptation).toBe(false);
    expect(result.mutates_historical_records).toBe(false);
    expect(record.advisory_only).toBe(true);
  });

  it("replays confidence degradation analyses", () => {
    const result = analyzeConfidenceDegradation({ scenario: "HIGH" });

    expect(replayConfidenceDegradation(result)).toBe(true);
  });

  it.each([
    ["MISSING_CONFIDENCE_HISTORY", "CONFIDENCE_HISTORY_MISSING"],
    ["MISSING_OUTCOME_VALIDATION", "OUTCOME_VALIDATION_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_HISTORY_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["CONFIDENCE_MUTATION", "CONFIDENCE_MUTATION_DETECTED"],
    ["MODEL_UPDATE", "CONFIDENCE_MODEL_UPDATE_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["AUTO_ADAPTATION", "AUTOMATIC_ADAPTATION_DETECTED"],
    ["HISTORICAL_RECORD_MUTATION", "HISTORICAL_RECORD_MUTATION_DETECTED"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_ANALYSIS"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [ConfidenceDegradationScenario, ConfidenceDegradationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeConfidenceDegradation({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.updates_confidence_model).toBe(false);
  });

  it("keeps missing outcome validation pending instead of certified", () => {
    const result = analyzeConfidenceDegradation({ scenario: "MISSING_OUTCOME_VALIDATION" });

    expect(result.validation.state).toBe("PENDING_OUTCOME_VALIDATION");
    expect(result.validation.outcome_validation_complete).toBe(false);
  });

  it("detects confidence degradation tampering during replay", () => {
    const result = analyzeConfidenceDegradation({ scenario: "HIGH" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayConfidenceDegradation(tampered)).toBe(false);
  });
});
