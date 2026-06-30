import { describe, expect, it, vi } from "vitest";
import {
  buildCertifiedDriftBaselines,
  buildTrendReports,
  certifyDriftIntelligence,
  computeDriftRecordHash,
  evaluateDriftIntelligence,
  getDriftDetectionTrendIntelligenceContract,
  publishDriftIntelligence,
  replayDriftIntelligence,
  validateDriftIntelligence,
} from "@/services/drift-detection-trend-intelligence-engine";
import type { DriftFailure, DriftScenario } from "@/types/drift-detection-trend-intelligence-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.1D Drift Detection & Trend Intelligence Engine", () => {
  it("defines drift doctrine, lifecycle, domains, severities, and immutable baselines", () => {
    const contract = getDriftDetectionTrendIntelligenceContract();

    expect(contract.doctrine.engine_version).toBe("drift-detection-trend-intelligence-engine/v8ALT.1D");
    expect(contract.doctrine.principles).toContain("deterministic");
    expect(contract.doctrine.principles).toContain("advisory-only");
    expect(contract.doctrine.lifecycle).toContain("LOAD_CERTIFIED_BASELINES");
    expect(contract.doctrine.lifecycle).toContain("PUBLISH_INTELLIGENCE");
    expect(contract.doctrine.domains).toEqual(["CONFIDENCE", "POLICY", "CONSTITUTIONAL", "EXECUTION", "PLANNING", "ORCHESTRATION", "DELEGATION", "SUPERVISION", "GOVERNANCE"]);
    expect(contract.doctrine.severity_levels).toEqual(["NONE", "MINIMAL", "LOW", "MODERATE", "HIGH", "SEVERE", "CRITICAL"]);
    expect(contract.baselines.length).toBe(10);
    expect(contract.baselines.every((baseline) => baseline.immutable && baseline.replay_compatible && baseline.integrity_hash)).toBe(true);
  });

  it("certifies the no-drift baseline with trend reports, forecast, evidence, replay, and integrity", () => {
    const record = evaluateDriftIntelligence();
    const validation = validateDriftIntelligence(record);
    const certification = certifyDriftIntelligence(record);
    const trends = buildTrendReports(record);

    expect(record.engine_version).toBe("drift-detection-trend-intelligence-engine/v8ALT.1D");
    expect(record.drift_severity).toBe("NONE");
    expect(record.drift_score).toBe(0);
    expect(record.trend_direction).toBe("STABLE");
    expect(record.anomaly_detected).toBe(false);
    expect(record.forecast.certification_readiness).toBe(true);
    expect(record.supporting_evidence.length).toBeGreaterThan(0);
    expect(trends.length).toBe(3);
    expect(trends.every((trend) => trend.replay_reference === record.replay_reference)).toBe(true);
    expect(validation.valid).toBe(true);
    expect(certification.certified).toBe(true);
    expect(certification.ready_for_assurance_recommendation_engine).toBe(true);
  });

  it.each([
    ["RAPID_CONFIDENCE_DEGRADATION", "RAPID_CONFIDENCE_DEGRADATION"],
    ["LONG_TERM_CONFIDENCE_DECLINE", "LONG_TERM_CONFIDENCE_DECLINE"],
    ["CONFIDENCE_OSCILLATION", "CONFIDENCE_OSCILLATION"],
    ["CONFIDENCE_COLLAPSE", "CONFIDENCE_COLLAPSE"],
    ["POLICY_DRIFT", "POLICY_DRIFT"],
    ["CONSTITUTIONAL_DRIFT", "CONSTITUTIONAL_DRIFT"],
    ["AUTHORITY_DRIFT", "AUTHORITY_DRIFT"],
    ["COMPLIANCE_DEGRADATION", "COMPLIANCE_DEGRADATION"],
    ["EXECUTION_DEGRADATION", "EXECUTION_DEGRADATION"],
    ["PLANNING_DEGRADATION", "PLANNING_DEGRADATION"],
    ["ORCHESTRATION_DEGRADATION", "ORCHESTRATION_DEGRADATION"],
    ["DELEGATION_DEGRADATION", "DELEGATION_DEGRADATION"],
    ["SUPERVISION_DEGRADATION", "SUPERVISION_DEGRADATION"],
    ["RECURRING_INSTABILITY", "RECURRING_INSTABILITY"],
    ["PERSISTENT_DEGRADATION", "PERSISTENT_DEGRADATION"],
    ["ANOMALY_CLUSTER", "ANOMALY_CLUSTER"],
    ["CASCADING_FAILURES", "CASCADING_FAILURES"],
    ["BASELINE_INVALID", "BASELINE_INVALID"],
    ["FORECAST_INVALID", "FORECAST_INVALID"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE"],
    ["EXECUTION_AUTHORITY_ATTEMPT", "UNAUTHORIZED_EXECUTION_CAPABILITY"],
  ] as readonly [DriftScenario, DriftFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const record = evaluateDriftIntelligence({ scenario });
      const validation = validateDriftIntelligence(record);
      const certification = certifyDriftIntelligence(record);

      expect(validation.valid).toBe(false);
      expect(validation.validation_state).toBe("FAIL");
      expect(validation.failures).toContain(failure);
      expect(certification.certified).toBe(false);
      expect(certification.ready_for_assurance_recommendation_engine).toBe(false);
    },
  );

  it("forecasts degradation and classifies anomalies deterministically", () => {
    const record = evaluateDriftIntelligence({ scenario: "CASCADING_FAILURES" });

    expect(record.drift_severity).toBe("CRITICAL");
    expect(record.anomaly_detected).toBe(true);
    expect(record.predicted_health).toBeLessThan(record.current_state);
    expect(record.forecast.degradation_forecast).toContain("degradation likely");
    expect(record.drift_explanation.anomaly_rationale).toContain("threshold exceeded");
    expect(record.degradation_velocity).toBeGreaterThan(0);
  });

  it("replays drift intelligence with identical score, forecast, explanation, and hash", () => {
    const first = evaluateDriftIntelligence();
    const second = evaluateDriftIntelligence();
    const replay = replayDriftIntelligence(first);

    expect(second.record_hash).toBe(first.record_hash);
    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(first.record_hash).toBe(computeDriftRecordHash(first));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_drift_score).toBe(first.drift_score);
    expect(replay.reconstructed_forecast_hash).toBe(first.forecast.forecast_hash);
    expect(replay.reconstructed_explanation_hash).toBe(first.drift_explanation.explanation_hash);
  });

  it("publishes passive operator intelligence and certified baselines", () => {
    const record = evaluateDriftIntelligence({ scenario: "POLICY_DRIFT" });
    const surface = publishDriftIntelligence(record);
    const baselines = buildCertifiedDriftBaselines();

    expect(surface.drift_category).toBe("POLICY");
    expect(surface.drift_severity).not.toBe("NONE");
    expect(surface.recommendations[0]).toContain("POLICY");
    expect(surface.advisory_only).toBe(true);
    expect(baselines.every((baseline) => baseline.baseline_version === "certified-drift-baseline/v8ALT.1D")).toBe(true);
  });

  it("keeps baseline drift intelligence advisory-only", () => {
    const record = evaluateDriftIntelligence();

    expect(record.advisory_only).toBe(true);
    expect(record.execution_authorized).toBe(false);
    expect(record.execution_modified).toBe(false);
    expect(record.governance_modified).toBe(false);
    expect(validateDriftIntelligence(record).advisory_only).toBe(true);
  });
});
