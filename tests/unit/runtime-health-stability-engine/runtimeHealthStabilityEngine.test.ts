import { describe, expect, it, vi } from "vitest";
import {
  certifyRuntimeHealth,
  computeRuntimeHealthRecordHash,
  evaluateRuntimeHealth,
  getRuntimeHealthStabilityEngineContract,
  publishRuntimeHealth,
  replayRuntimeHealth,
  validateRuntimeHealth,
} from "@/services/runtime-health-stability-engine";
import type { RuntimeHealthFailure, RuntimeHealthScenario } from "@/types/runtime-health-stability-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.1C Runtime Health & Stability Engine", () => {
  it("defines health doctrine, lifecycle, components, governed weights, and health levels", () => {
    const contract = getRuntimeHealthStabilityEngineContract();

    expect(contract.doctrine.engine_version).toBe("runtime-health-stability-engine/v8ALT.1C");
    expect(contract.doctrine.principles).toContain("deterministic");
    expect(contract.doctrine.principles).toContain("advisory-only");
    expect(contract.doctrine.lifecycle).toEqual(["COLLECT_RUNTIME_DATA", "VALIDATE_TELEMETRY", "EVALUATE_SUBSYSTEM_HEALTH", "CALCULATE_STABILITY", "ANALYZE_TRENDS", "DETECT_ANOMALIES", "GENERATE_EXPLANATION", "VALIDATE_REPLAY", "STORE_HEALTH_RECORD", "PUBLISH_RESULTS"]);
    expect(contract.doctrine.components).toEqual(["EXECUTION", "PLANNING", "ORCHESTRATION", "DELEGATION", "SUPERVISION", "GOVERNANCE", "INTEGRITY"]);
    expect(contract.doctrine.weights.EXECUTION).toBe(0.25);
    expect(Object.values(contract.doctrine.weights).reduce((sum, item) => sum + item, 0)).toBeCloseTo(1);
    expect(contract.doctrine.health_levels).toEqual(["OPTIMAL", "HEALTHY", "STABLE", "WATCH", "DEGRADED", "HIGH_RISK", "CRITICAL"]);
  });

  it("evaluates baseline runtime health with normalized subsystem health, stability indicators, and immutable timeline", () => {
    const record = evaluateRuntimeHealth();
    const validation = validateRuntimeHealth(record);
    const certification = certifyRuntimeHealth(record);

    expect(record.engine_version).toBe("runtime-health-stability-engine/v8ALT.1C");
    expect(record.overall_runtime_health).toBeGreaterThanOrEqual(90);
    expect(record.health_level).toBe("OPTIMAL");
    expect(record.subsystem_health.length).toBe(7);
    expect(record.stability_indicators.length).toBe(28);
    expect(record.stability_indicators.every((item) => item.normalized_value >= 0 && item.normalized_value <= 100)).toBe(true);
    expect(record.timeline[0]?.append_only).toBe(true);
    expect(record.health_explanation.supporting_evidence.length).toBeGreaterThan(0);
    expect(validation.valid).toBe(true);
    expect(certification.certified).toBe(true);
    expect(certification.ready_for_drift_detection_engine).toBe(true);
  });

  it.each([
    ["INCOMPLETE_TELEMETRY", "INCOMPLETE_TELEMETRY"],
    ["INVALID_TELEMETRY", "INVALID_TELEMETRY"],
    ["EXECUTION_INSTABILITY", "EXECUTION_INSTABILITY"],
    ["PLANNING_INSTABILITY", "PLANNING_INSTABILITY"],
    ["ORCHESTRATION_INSTABILITY", "ORCHESTRATION_INSTABILITY"],
    ["DELEGATION_INSTABILITY", "DELEGATION_INSTABILITY"],
    ["SUPERVISION_INSTABILITY", "SUPERVISION_INSTABILITY"],
    ["CONFIDENCE_OSCILLATION", "CONFIDENCE_OSCILLATION"],
    ["REPEATED_DEGRADATION", "REPEATED_DEGRADATION"],
    ["REPEATED_RECOVERY", "REPEATED_RECOVERY"],
    ["CHECKPOINT_FAILURES", "CHECKPOINT_FAILURES"],
    ["EXCESSIVE_RETRIES", "EXCESSIVE_RETRIES"],
    ["EXCESSIVE_ROLLBACKS", "EXCESSIVE_ROLLBACKS"],
    ["STALLED_EXECUTION", "STALLED_EXECUTION"],
    ["DEPENDENCY_FAILURES", "DEPENDENCY_FAILURES"],
    ["SYNCHRONIZATION_FAILURES", "SYNCHRONIZATION_FAILURES"],
    ["RECURRING_WORKFLOW_FAILURES", "RECURRING_WORKFLOW_FAILURES"],
    ["REPEATED_PLANNING_FAILURES", "REPEATED_PLANNING_FAILURES"],
    ["REPEATED_GOVERNANCE_VIOLATIONS", "REPEATED_GOVERNANCE_VIOLATIONS"],
    ["REPEATED_INTEGRITY_FAILURES", "REPEATED_INTEGRITY_FAILURES"],
    ["UNHEALTHY_TREND", "UNHEALTHY_TREND"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE"],
    ["EXECUTION_AUTHORITY_ATTEMPT", "UNAUTHORIZED_EXECUTION_CAPABILITY"],
  ] as readonly [RuntimeHealthScenario, RuntimeHealthFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const record = evaluateRuntimeHealth({ scenario });
      const validation = validateRuntimeHealth(record);
      const certification = certifyRuntimeHealth(record);

      expect(validation.valid).toBe(false);
      expect(validation.validation_state).toBe("FAIL");
      expect(validation.failures).toContain(failure);
      expect(certification.certified).toBe(false);
      expect(certification.ready_for_drift_detection_engine).toBe(false);
    },
  );

  it("detects oscillation and declining health trends deterministically", () => {
    const record = evaluateRuntimeHealth({ scenario: "REPEATED_DEGRADATION" });

    expect(record.detected_oscillation).toBe(true);
    expect(record.oscillation_report.severity).toBe("HIGH");
    expect(record.health_trend).toBe("DECLINING");
    expect(record.trend_velocity).toBeLessThan(0);
    expect(record.health_explanation.trend_interpretation).toContain("degrading");
    expect(record.timeline[0]?.degradation_events).toContain("REPEATED_DEGRADATION");
  });

  it("replays health records with identical hashes, stability, timeline, and explanation", () => {
    const first = evaluateRuntimeHealth();
    const second = evaluateRuntimeHealth();
    const replay = replayRuntimeHealth(first);

    expect(second.record_hash).toBe(first.record_hash);
    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(first.record_hash).toBe(computeRuntimeHealthRecordHash(first));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_explanation_hash).toBe(first.health_explanation.explanation_hash);
    expect(replay.reconstructed_timeline_hash).toBe(first.timeline[0]?.timeline_hash);
    expect(replay.replay_failures).toEqual([]);
  });

  it("publishes operator health without granting execution authority", () => {
    const surface = publishRuntimeHealth(evaluateRuntimeHealth({ scenario: "EXECUTION_INSTABILITY" }));

    expect(surface.overall_runtime_health).toBeLessThan(90);
    expect(surface.detected_instability).toContain("EXECUTION_INSTABILITY");
    expect(surface.detected_oscillation).toBe(false);
    expect(surface.advisory_only).toBe(true);
  });

  it("keeps baseline health evaluation observational and advisory-only", () => {
    const record = evaluateRuntimeHealth();

    expect(record.advisory_only).toBe(true);
    expect(record.execution_authorized).toBe(false);
    expect(record.execution_modified).toBe(false);
    expect(record.governance_modified).toBe(false);
    expect(validateRuntimeHealth(record).advisory_only).toBe(true);
  });
});
