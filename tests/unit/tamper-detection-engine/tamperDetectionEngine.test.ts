import { describe, expect, it, vi } from "vitest";
import {
  buildTamperDetectionObservabilitySurface,
  classifyTamperDetectionReason,
  getTamperDetectionContract,
  runTamperDetection,
  validateTamperDetectionReport,
} from "@/services/tamper-detection-engine";
import type { TamperDetectionReason, TamperDetectionScenario, TamperDetectionState } from "@/types/tamper-detection-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 8H.3 Tamper Detection Engine", () => {
  it("defines the tamper detection doctrine and monitoring contract", () => {
    const contract = getTamperDetectionContract();

    expect(contract.doctrine.schema_version).toBe("tamper-detection-engine/v8H.3");
    expect(contract.doctrine.principles).toContain("continuous-autonomy-integrity-monitoring");
    expect(contract.doctrine.principles).toContain("replay-alteration-detection");
    expect(contract.doctrine.principles).toContain("forensic-evidence-generation");
    expect(contract.doctrine.principles).toContain("fail-closed-certification-response");
  });

  it("monitors a valid autonomous hash chain as clean", () => {
    const report = runTamperDetection();

    expect(report.phase_version).toBe("8H.3");
    expect(report.detection_state).toBe("CLEAN");
    expect(report.integrity_state).toBe("VALID");
    expect(report.monitoring_state).toBe("MONITORING");
    expect(report.detections).toEqual([]);
    expect(report.alerts).toEqual([]);
    expect(report.certification_ready).toBe(true);
    expect(report.forensic_evidence.evidence_hash).toBeTruthy();
  });

  it("produces deterministic reports for identical inputs", () => {
    const first = runTamperDetection({ scenario: "REPLAY_ALTERATION" });
    const second = runTamperDetection({ scenario: "REPLAY_ALTERATION" });

    expect(first.report_hash).toBe(second.report_hash);
    expect(first.forensic_evidence.evidence_hash).toBe(second.forensic_evidence.evidence_hash);
    expect(first.detections.map((detection) => detection.detection_id)).toEqual(second.detections.map((detection) => detection.detection_id));
  });

  it.each([
    ["INCONSISTENT_HASH", "INCONSISTENT_HASH", "CORRUPTED"],
    ["DUPLICATE_HASH", "DUPLICATE_HASH", "CORRUPTED"],
    ["UNAUTHORIZED_MODIFICATION", "UNAUTHORIZED_MODIFICATION", "CORRUPTED"],
    ["DELETED_RECORD", "DELETED_RECORD", "CORRUPTED"],
    ["INSERTED_RECORD", "INSERTED_RECORD", "CORRUPTED"],
    ["REPLAY_ALTERATION", "REPLAY_ALTERATION", "CORRUPTED"],
    ["REPLAY_OMISSION", "REPLAY_OMISSION", "CORRUPTED"],
    ["LINEAGE_CORRUPTION", "LINEAGE_CORRUPTION", "CORRUPTED"],
    ["ORPHAN_RECORD", "ORPHAN_RECORD", "CORRUPTED"],
    ["MISSING_PARENT", "MISSING_PARENT", "CORRUPTED"],
    ["EXECUTION_DIVERGENCE", "EXECUTION_DIVERGENCE", "INVALID"],
    ["CHECKPOINT_INCONSISTENCY", "CHECKPOINT_INCONSISTENCY", "INVALID"],
    ["ORDERING_MUTATION", "ORDERING_MUTATION", "CORRUPTED"],
    ["GOVERNANCE_REFERENCE_LOSS", "GOVERNANCE_REFERENCE_LOSS", "DEGRADED"],
    ["CONSTITUTIONAL_REFERENCE_LOSS", "CONSTITUTIONAL_REFERENCE_LOSS", "INVALID"],
    ["CROSS_TENANT_LINKAGE", "CROSS_TENANT_LINKAGE", "CORRUPTED"],
    ["MALFORMED_METADATA", "MALFORMED_METADATA", "DEGRADED"],
    ["HISTORICAL_INCONSISTENCY", "HISTORICAL_INCONSISTENCY", "CORRUPTED"],
    ["UNSUPPORTED_HASH_ALGORITHM", "UNSUPPORTED_HASH_ALGORITHM", "DEGRADED"],
  ] as readonly [TamperDetectionScenario, TamperDetectionReason, TamperDetectionState][])(
    "classifies %s as %s",
    (scenario, reason, expectedState) => {
      const report = runTamperDetection({ scenario });

      expect(classifyTamperDetectionReason(reason)).toBe(expectedState);
      expect(report.detection_state).toBe(expectedState);
      expect(report.detections.map((detection) => detection.detected_issue)).toContain(reason);
      expect(report.alerts.length).toBe(report.detections.length);
      expect(report.certification_ready).toBe(false);
      expect(report.repair_recommendations.length).toBeGreaterThan(0);
    },
  );

  it("fails closed and notifies governance for critical execution divergence", () => {
    const report = runTamperDetection({ scenario: "EXECUTION_DIVERGENCE" });

    expect(report.detection_state).toBe("INVALID");
    expect(report.integrity_state).toBe("CORRUPTED");
    expect(report.alerts[0].severity).toBe("CRITICAL");
    expect(report.alerts[0].certification_suspended).toBe(true);
    expect(report.governance_notifications).toHaveLength(1);
    expect(report.replay_verification.replay_reproducible).toBe(false);
    expect(report.certification_ready).toBe(false);
  });

  it("distinguishes degraded governance gaps from confirmed corruption", () => {
    const report = runTamperDetection({ scenario: "GOVERNANCE_REFERENCE_LOSS" });

    expect(report.detection_state).toBe("DEGRADED");
    expect(report.integrity_state).toBe("DEGRADED");
    expect(report.alerts[0].severity).toBe("MEDIUM");
    expect(report.alerts[0].certification_suspended).toBe(false);
    expect(report.governance_notifications).toHaveLength(1);
  });

  it("validates report completeness for forensic evidence and alerts", () => {
    const report = runTamperDetection({ scenario: "UNAUTHORIZED_MODIFICATION" });
    const validation = validateTamperDetectionReport(report);

    expect(validation.tamper_detected).toBe(true);
    expect(validation.alerts_emitted).toBe(true);
    expect(validation.forensic_evidence_complete).toBe(true);
    expect(validation.certification_ready).toBe(false);
    expect(validation.report_hash).toBe(report.report_hash);
  });

  it("exposes operator diagnostics for corrupted monitoring", () => {
    const surface = buildTamperDetectionObservabilitySurface({ scenario: "REPLAY_OMISSION" });

    expect(surface.detection_state).toBe("CORRUPTED");
    expect(surface.integrity_state).toBe("CORRUPTED");
    expect(surface.detections).toContain("REPLAY_OMISSION");
    expect(surface.downstream_blocked).toBe(true);
    expect(surface.alert_count).toBeGreaterThan(0);
    expect(surface.forensic_evidence_hash).toBeTruthy();
  });
});
