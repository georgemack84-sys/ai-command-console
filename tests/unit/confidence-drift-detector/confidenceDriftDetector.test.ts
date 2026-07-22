import { describe, expect, it } from "vitest";
import {
  analyzeConfidenceDrift,
  getConfidenceDriftFoundation,
  replayConfidenceDrift,
} from "@/services/confidence-drift-detector";
import type { ConfidenceDriftFailure, ConfidenceDriftScenario } from "@/types/confidence-drift-detector";

describe("Mission Control Phase 10.6.2 Confidence Drift Detector", () => {
  it("publishes the confidence drift detector foundation", () => {
    const foundation = getConfidenceDriftFoundation();

    expect(foundation.confidence_drift_detector_version).toBe("confidence-drift-detector/v1");
    expect(foundation.api_surface.analyze_drift).toBe("POST /confidence-drift-detector/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("detects confidence drift deterministically", () => {
    const first = analyzeConfidenceDrift({ scenario: "SEVERE" });
    const second = analyzeConfidenceDrift({ scenario: "SEVERE" });

    expect(first.drift_records[0].confidence_drift_id).toBe(second.drift_records[0].confidence_drift_id);
    expect(first.trend_profile.error_growth_rate).toBe(second.trend_profile.error_growth_rate);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("classifies supported drift categories", () => {
    expect(analyzeConfidenceDrift({ scenario: "NONE" }).drift_records[0].drift_category).toBe("NONE");
    expect(analyzeConfidenceDrift({ scenario: "MINOR" }).drift_records[0].drift_category).toBe("MINOR");
    expect(analyzeConfidenceDrift({ scenario: "MODERATE" }).drift_records[0].drift_category).toBe("MODERATE");
    expect(analyzeConfidenceDrift({ scenario: "SEVERE" }).drift_records[0].drift_category).toBe("SEVERE");
    expect(analyzeConfidenceDrift({ scenario: "CRITICAL" }).drift_records[0].drift_category).toBe("CRITICAL");
  });

  it("detects evidence, environmental, mission, tenant, seasonal, and domain drift dimensions", () => {
    expect(analyzeConfidenceDrift({ scenario: "EVIDENCE_DETERIORATION" }).drift_records[0].drift_type).toBe("EVIDENCE_QUALITY");
    expect(analyzeConfidenceDrift({ scenario: "ENVIRONMENTAL_SHIFT" }).drift_records[0].drift_type).toBe("ENVIRONMENTAL");
    expect(analyzeConfidenceDrift({ scenario: "MISSION_SPECIFIC" }).report.mission_drift).toBe("MODERATE");
    expect(analyzeConfidenceDrift({ scenario: "TENANT_SPECIFIC" }).report.tenant_drift).toBe("SEVERE");
    expect(analyzeConfidenceDrift({ scenario: "SEASONAL_VARIATION" }).report.seasonal_drift).toBe("MINOR");
    expect(analyzeConfidenceDrift({ scenario: "DOMAIN_SPECIFIC" }).report.domain_drift).toBe("MODERATE");
  });

  it("records drift magnitude, velocity, duration, and trend metrics", () => {
    const result = analyzeConfidenceDrift({ scenario: "CRITICAL" });
    const record = result.drift_records[0];

    expect(record.drift_magnitude).toBeGreaterThan(0);
    expect(record.drift_velocity).toBeGreaterThan(0);
    expect(record.drift_duration_days).toBeGreaterThan(0);
    expect(result.trend_profile.error_growth_rate).toBeGreaterThan(0);
    expect(result.trend_profile.calibration_drift_rate).toBeGreaterThan(0);
    expect(result.trend_profile.evidence_quality_delta).toBeGreaterThan(0);
  });

  it("builds immutable timeline and registry records", () => {
    const result = analyzeConfidenceDrift({ scenario: "MODERATE" });
    const record = result.drift_records[0];

    expect(result.timeline.append_only).toBe(true);
    expect(result.timeline.immutable).toBe(true);
    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.drift_record_refs).toContain(record.confidence_drift_id);
    expect(result.registry.severity_index.MODERATE).toContain(record.confidence_drift_id);
  });

  it("generates explainable governance-visible reports", () => {
    const result = analyzeConfidenceDrift({ scenario: "SEVERE" });

    expect(result.report.detected_patterns).toContain("CONFIDENCE_ERROR");
    expect(result.report.governance_findings.length).toBeGreaterThan(0);
    expect(result.report.recommended_actions.length).toBeGreaterThan(0);
    expect(result.report.replay_refs.length).toBeGreaterThan(0);
  });

  it("stays advisory-only without confidence mutation, model updates, or adaptation triggers", () => {
    const result = analyzeConfidenceDrift({ scenario: "CRITICAL" });
    const record = result.drift_records[0];

    expect(result.advisory_only).toBe(true);
    expect(result.mutates_confidence).toBe(false);
    expect(result.updates_model).toBe(false);
    expect(result.triggers_adaptation).toBe(false);
    expect(record.advisory_only).toBe(true);
    expect(record.mutates_confidence).toBe(false);
    expect(record.triggers_adaptation).toBe(false);
  });

  it("replays confidence drift analyses", () => {
    const result = analyzeConfidenceDrift({ scenario: "MODERATE" });

    expect(replayConfidenceDrift(result)).toBe(true);
  });

  it.each([
    ["MISSING_BASELINE", "HISTORICAL_BASELINE_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_HISTORY_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["CONFIDENCE_MUTATION", "CONFIDENCE_MUTATION_DETECTED"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_ANALYSIS"],
    ["AUTO_RECALIBRATION", "AUTOMATIC_RECALIBRATION_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [ConfidenceDriftScenario, ConfidenceDriftFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeConfidenceDrift({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.updates_model).toBe(false);
  });

  it("keeps missing evidence pending instead of certified", () => {
    const result = analyzeConfidenceDrift({ scenario: "MISSING_EVIDENCE" });

    expect(result.validation.state).toBe("PENDING_EVIDENCE");
    expect(result.validation.evidence_complete).toBe(false);
  });

  it("detects confidence drift tampering during replay", () => {
    const result = analyzeConfidenceDrift({ scenario: "MODERATE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayConfidenceDrift(tampered)).toBe(false);
  });
});
