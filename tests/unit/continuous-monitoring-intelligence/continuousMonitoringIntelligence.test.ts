import { describe, expect, it } from "vitest";
import {
  getContinuousMonitoringIntelligenceBundle,
  replayContinuousMonitoringIntelligence,
  runContinuousMonitoringIntelligence,
  validateContinuousMonitoringIntelligence,
} from "@/services/continuous-monitoring-intelligence";
import type {
  ContinuousMonitoringIntelligenceFailure,
  ContinuousMonitoringIntelligenceResult,
} from "@/types/continuous-monitoring-intelligence";

const failureScenarios: ContinuousMonitoringIntelligenceFailure[] = [
  "MONITORING_INCOMPLETE",
  "OPERATIONAL_AWARENESS_NOT_CONTINUOUS",
  "CHANGE_DETECTION_NOT_DETERMINISTIC",
  "OPERATIONAL_INTELLIGENCE_NOT_REPRODUCIBLE",
  "HEALTH_ASSESSMENT_NOT_DETERMINISTIC",
  "ANOMALY_COVERAGE_INCOMPLETE",
  "MONITORING_REPLAY_NOT_VALIDATED",
  "GOVERNANCE_ATTRIBUTION_INCOMPLETE",
  "MONITORING_EVIDENCE_MUTABLE",
  "CONSTITUTIONAL_COMPLIANCE_NOT_PRESERVED",
  "STANDING_MONITORING_SERVICES_NOT_OPERATIONAL",
  "PHASE_18_2_NOT_CERTIFIED",
  "MONITORING_HAS_OPERATIONAL_AUTHORITY",
  "OBSERVATION_NOT_DETERMINISTIC",
  "PHASE_18_1_FOUNDATION_NOT_VALID",
];

describe("continuous monitoring intelligence", () => {
  it("publishes the Phase 18.2 doctrine and validates the baseline bundle", () => {
    const bundle = getContinuousMonitoringIntelligenceBundle();

    expect(bundle.doctrine.version).toBe("continuous-monitoring-intelligence/v18.2");
    expect(bundle.doctrine.upstream_phase).toBe("continuous-operations-foundation/v18.1");
    expect(bundle.doctrine.lifecycle_states).toEqual([
      "DISCOVER",
      "OBSERVE",
      "COLLECT",
      "ANALYZE",
      "DETECT",
      "CLASSIFY",
      "RECORD",
      "PUBLISH",
      "COMPLETE",
    ]);
    expect(bundle.doctrine.monitoring_domains).toEqual([
      "PLATFORM",
      "INFRASTRUCTURE",
      "GOVERNANCE",
      "CERTIFICATION",
      "REPLAY",
      "SECURITY",
    ]);
    expect(bundle.doctrine.change_categories).toHaveLength(8);
    expect(bundle.doctrine.health_states).toEqual([
      "HEALTHY",
      "DEGRADED",
      "WARNING",
      "UNAVAILABLE",
      "QUALIFICATION_REQUIRED",
    ]);
    expect(bundle.doctrine.anomaly_categories).toHaveLength(8);
    expect(bundle.result.outcome).toBe("PASS");
    expect(bundle.validation.valid).toBe(true);
  });

  it("keeps monitoring advisory-only, deterministic, and complete", () => {
    const result = runContinuousMonitoringIntelligence();

    expect(result.operations_monitor.advisory_only).toBe(true);
    expect(result.operations_monitor.deterministic_observation).toBe(true);
    expect(result.operations_monitor.monitoring_domains).toHaveLength(6);
    expect(result.monitoring_cycle.complete).toBe(true);
    expect(result.monitoring_cycle.lifecycle.at(-1)).toBe("COMPLETE");
  });

  it("produces deterministic health, performance, and capacity intelligence", () => {
    const result = runContinuousMonitoringIntelligence();

    expect(result.health_analyzer.operational_health).toBe("HEALTHY");
    expect(result.health_analyzer.constitutional_compliance).toBe(true);
    expect(result.health_analyzer.deterministic_assessment).toBe(true);
    expect(result.performance_intelligence.reproducible).toBe(true);
    expect(result.capacity_intelligence.reproducible).toBe(true);
  });

  it("detects all operational change categories with governance and replay attribution", () => {
    const result = runContinuousMonitoringIntelligence();
    const categories = result.change_detector.change_records.map((record) => record.change_category);

    expect(result.change_detector.deterministic_detection).toBe(true);
    expect(result.change_detector.change_records).toHaveLength(8);
    expect(new Set(categories).size).toBe(8);
    for (const record of result.change_detector.change_records) {
      expect(record.detection_result).toBe("NO_CHANGE");
      expect(record.governing_policy_ref).not.toHaveLength(0);
      expect(record.constitutional_authority_ref).not.toHaveLength(0);
      expect(record.evidence_refs.length).toBeGreaterThan(0);
      expect(record.replay_refs.length).toBeGreaterThan(0);
    }
  });

  it("classifies all anomaly categories and records immutable reports", () => {
    const result = runContinuousMonitoringIntelligence();

    expect(result.anomaly_classifier.categories).toHaveLength(8);
    expect(result.anomaly_classifier.anomaly_refs).toHaveLength(8);
    expect(result.anomaly_classifier.coverage_complete).toBe(true);
    expect(result.output_reports.map((report) => report.report_type)).toEqual([
      "PLATFORM_HEALTH",
      "OPERATIONAL_CHANGE",
      "PERFORMANCE_INTELLIGENCE",
      "CAPACITY_INTELLIGENCE",
      "GOVERNANCE_HEALTH",
      "REPLAY_HEALTH",
      "CERTIFICATION_HEALTH",
      "SECURITY_HEALTH",
    ]);
    expect(result.evidence_ledger).toHaveLength(8);
    expect(result.evidence_ledger.every((entry) => entry.append_only && entry.immutable)).toBe(true);
  });

  it("certifies the Phase 18.2 exit criteria", () => {
    const result = runContinuousMonitoringIntelligence();

    expect(result.certification_package.monitoring_complete).toBe(true);
    expect(result.certification_package.operational_awareness_continuous).toBe(true);
    expect(result.certification_package.change_detection_deterministic).toBe(true);
    expect(result.certification_package.operational_intelligence_reproducible).toBe(true);
    expect(result.certification_package.health_assessment_deterministic).toBe(true);
    expect(result.certification_package.anomaly_coverage_complete).toBe(true);
    expect(result.certification_package.monitoring_replay_validated).toBe(true);
    expect(result.certification_package.governance_attribution_complete).toBe(true);
    expect(result.certification_package.immutable_monitoring_evidence_verified).toBe(true);
    expect(result.certification_package.constitutional_compliance_preserved).toBe(true);
    expect(result.certification_package.standing_monitoring_services_operational).toBe(true);
    expect(result.certification_package.phase_18_2_certified).toBe(true);
    expect(result.certification_tests).toHaveLength(14);
    expect(result.certification_tests.every((test) => test.passed)).toBe(true);
  });

  it("is deterministic and replayable", { timeout: 300_000 }, () => {
    const first = runContinuousMonitoringIntelligence();
    const second = runContinuousMonitoringIntelligence();

    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateContinuousMonitoringIntelligence(first).valid).toBe(true);
    expect(replayContinuousMonitoringIntelligence(first)).toBe(true);
  });

  it("allows a non-constitutional warning only as a conditional non-valid pass", () => {
    const result = runContinuousMonitoringIntelligence({
      scenario: "NON_CONSTITUTIONAL_MONITORING_WARNING",
    });
    const validation = validateContinuousMonitoringIntelligence(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.failures).toEqual(["NON_CONSTITUTIONAL_MONITORING_WARNING"]);
    expect(validation.valid).toBe(false);
    expect(validation.certification_valid).toBe(true);
  });

  it.each(failureScenarios)("fails deterministically for %s", (scenario) => {
    const result = runContinuousMonitoringIntelligence({ scenario });
    const validation = validateContinuousMonitoringIntelligence(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(scenario);
  });

  it("detects result tampering through component and replay validation", () => {
    const result = runContinuousMonitoringIntelligence();
    const tamperedCycle: ContinuousMonitoringIntelligenceResult = {
      ...result,
      monitoring_cycle: {
        ...result.monitoring_cycle,
        complete: false,
      },
    };
    const tamperedReplay: ContinuousMonitoringIntelligenceResult = {
      ...result,
      replay_hash: "tampered-replay-hash",
    };
    const cycleValidation = validateContinuousMonitoringIntelligence(tamperedCycle);
    const replayValidation = validateContinuousMonitoringIntelligence(tamperedReplay);

    expect(cycleValidation.valid).toBe(false);
    expect(cycleValidation.cycle_valid).toBe(false);
    expect(replayValidation.valid).toBe(false);
    expect(replayValidation.result_replay_valid).toBe(false);
  });
});
