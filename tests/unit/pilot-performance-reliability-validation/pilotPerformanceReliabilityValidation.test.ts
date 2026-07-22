import { describe, expect, it } from "vitest";
import {
  getPilotPerformanceReliabilityValidationBundle,
  replayPilotPerformanceReliabilityValidation,
  runPilotPerformanceReliabilityValidation,
  validatePilotPerformanceReliabilityValidation,
} from "@/services/pilot-performance-reliability-validation";
import type { PilotPerformanceReliabilityFailure } from "@/types/pilot-performance-reliability-validation";

describe("Mission Control Phase 16.6 Pilot Performance & Reliability Validation", () => {
  it("publishes pilot performance reliability doctrine", () => {
    const bundle = getPilotPerformanceReliabilityValidationBundle();

    expect(bundle.doctrine.version).toBe("pilot-performance-reliability-validation/v16.6");
    expect(bundle.doctrine.upstream_phase).toBe("production-replay-determinism/v16.5");
    expect(bundle.doctrine.threshold_lifecycle).toEqual(["PROPOSED", "UNDER_REVIEW", "APPROVED", "ACTIVE", "SUPERSEDED", "RETIRED", "ARCHIVED"]);
    expect(bundle.doctrine.threshold_classifications).toEqual(["CONSTITUTIONAL", "OPERATIONAL"]);
    expect(bundle.doctrine.vp1_statuses).toEqual(["VERIFIED", "DEFINED_BUT_UNPOPULATED", "MISSING"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("inherits constitutional thresholds and approves operational thresholds", () => {
    const result = runPilotPerformanceReliabilityValidation();

    expect(result.threshold_registry).toHaveLength(6);
    expect(result.threshold_registry.filter((threshold) => threshold.classification === "CONSTITUTIONAL").every((threshold) => threshold.inherited && threshold.class_a)).toBe(true);
    expect(result.threshold_registry.filter((threshold) => threshold.classification === "OPERATIONAL").every((threshold) => !threshold.inherited && threshold.lifecycle === "ACTIVE")).toBe(true);
    expect(result.threshold_registry.every((threshold) => threshold.immutable && threshold.authority_source && threshold.approval_authority)).toBe(true);
  });

  it("preserves threshold versioning and provenance", () => {
    const result = runPilotPerformanceReliabilityValidation();

    expect(result.threshold_versions).toHaveLength(result.threshold_registry.length);
    expect(result.threshold_versions.every((entry) => entry.version === "16.6.0" && entry.immutable && entry.replayable)).toBe(true);
    expect(result.threshold_provenance).toHaveLength(result.threshold_registry.length);
    expect(result.threshold_provenance.every((entry) => entry.complete && entry.certification_refs.length > 0 && entry.evidence_refs.length > 0)).toBe(true);
  });

  it("validates performance, reliability, capacity, and dashboard visibility", () => {
    const result = runPilotPerformanceReliabilityValidation();

    expect(result.performance_validator.deterministic_measurement).toBe(true);
    expect(result.performance_validator.evaluated_metrics).toHaveLength(11);
    expect(result.reliability_analyzer.complete).toBe(true);
    expect(result.reliability_analyzer.availability).toBeGreaterThanOrEqual(99.9);
    expect(result.capacity_monitor.operational).toBe(true);
    expect(result.availability_dashboard.operational).toBe(true);
    expect(result.availability_dashboard.operator_visibility_complete).toBe(true);
  });

  it("completes VP1 constitutional threshold audit", () => {
    const result = runPilotPerformanceReliabilityValidation();

    expect(result.vp1_report.complete).toBe(true);
    expect(result.vp1_report.certification_readiness).toBe("READY");
    expect(result.vp1_report.audited_thresholds).toHaveLength(3);
    expect(result.vp1_report.audited_thresholds.every((audit) => audit.status === "VERIFIED" && !audit.class_a_blocking)).toBe(true);
    expect(result.vp1_report.missing_threshold_report).toHaveLength(0);
    expect(result.vp1_report.class_a_blocking_report).toHaveLength(0);
  });

  it("records immutable threshold evidence ledger", () => {
    const result = runPilotPerformanceReliabilityValidation();

    expect(result.threshold_evidence_ledger).toHaveLength(9);
    expect(result.threshold_evidence_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.threshold_refs.length > 0 && entry.certification_refs.length > 0)).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runPilotPerformanceReliabilityValidation();
    const second = runPilotPerformanceReliabilityValidation();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePilotPerformanceReliabilityValidation(first).valid).toBe(true);
    expect(replayPilotPerformanceReliabilityValidation(first)).toBe(true);
  });

  it("executes the Phase 16.6 performance certification matrix", () => {
    const result = runPilotPerformanceReliabilityValidation();

    expect(result.certification_tests).toHaveLength(15);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Constitutional thresholds inherited",
      "Operational thresholds approved",
      "Threshold registry immutable",
      "Threshold provenance traceable",
      "Threshold versioning complete",
      "Performance validation deterministic",
      "Reliability validation complete",
      "Capacity monitoring operational",
      "Availability dashboard operational",
      "VP1 complete",
      "No unresolved Class A VP1 findings",
      "Certification evidence complete",
      "No undefined authority sources",
      "No missing constitutional thresholds",
      "Phase 16.5 replay valid",
    ]);
  });

  it("supports conditional pass for non-constitutional performance warnings", () => {
    const result = runPilotPerformanceReliabilityValidation({ scenario: "NON_CONSTITUTIONAL_PERFORMANCE_WARNING" });
    const validation = validatePilotPerformanceReliabilityValidation(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "CONSTITUTIONAL_THRESHOLDS_NOT_INHERITED",
    "OPERATIONAL_THRESHOLDS_NOT_APPROVED",
    "THRESHOLD_REGISTRY_MUTABLE",
    "THRESHOLD_PROVENANCE_INCOMPLETE",
    "THRESHOLD_VERSIONING_INCOMPLETE",
    "PERFORMANCE_VALIDATION_NON_DETERMINISTIC",
    "RELIABILITY_VALIDATION_INCOMPLETE",
    "CAPACITY_MONITORING_NOT_OPERATIONAL",
    "AVAILABILITY_DASHBOARD_NOT_OPERATIONAL",
    "VP1_INCOMPLETE",
    "UNRESOLVED_CLASS_A_FINDINGS",
    "CERTIFICATION_EVIDENCE_INCOMPLETE",
    "UNDEFINED_AUTHORITY_SOURCE",
    "MISSING_CONSTITUTIONAL_THRESHOLD",
    "PHASE_16_5_REPLAY_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: PilotPerformanceReliabilityFailure) => {
    const result = runPilotPerformanceReliabilityValidation({ scenario });
    const validation = validatePilotPerformanceReliabilityValidation(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested threshold tampering", () => {
    const result = runPilotPerformanceReliabilityValidation();
    const tampered = {
      ...result,
      threshold_registry: [
        {
          ...result.threshold_registry[0],
          immutable: false,
        },
        ...result.threshold_registry.slice(1),
      ],
    };

    expect(validatePilotPerformanceReliabilityValidation(tampered).valid).toBe(false);
  });
});
