import { describe, expect, it } from "vitest";
import {
  computeAdaptiveMemoryCertificationReportHash,
  getAdaptiveMemoryCertificationContract,
  replayAdaptiveMemoryCertification,
  runAdaptiveMemoryCertification,
  validateAdaptiveMemoryCertification,
} from "@/services/adaptive-memory-certification-gate";
import type { AdaptiveMemoryCertificationFailure, AdaptiveMemoryCertificationScenario } from "@/types/adaptive-memory-certification-gate";

describe("Mission Control Phase 10.13N Adaptive Memory Certification Gate", () => {
  it("publishes the certification doctrine and production gate contract", () => {
    const contract = getAdaptiveMemoryCertificationContract();

    expect(contract.doctrine.certification_version).toBe("adaptive-memory-certification-gate/v10.13N");
    expect(contract.doctrine.certification_scope).toHaveLength(13);
    expect(contract.doctrine.pass_rule).toBe("all-critical-tests-pass");
    expect(contract.doctrine.production_rule).toBe("pass-before-production-memory-reuse");
    expect(contract.report.certification_state).toBe("PASS");
    expect(contract.validation.valid).toBe(true);
    expect(contract.observability.production_deployment_authorized).toBe(true);
  });

  it("certifies baseline adaptive memory for governed production reuse", () => {
    const report = runAdaptiveMemoryCertification();
    const validation = validateAdaptiveMemoryCertification(report);

    expect(report.phase).toBe("10.13N");
    expect(report.certification_state).toBe("PASS");
    expect(report.production_deployment_authorized).toBe(true);
    expect(report.adaptive_memory_reuse_authorized).toBe(true);
    expect(report.validation_matrix).toHaveLength(52);
    expect(report.validation_matrix.every((item) => item.actual === "PASS")).toBe(true);
    expect(report.certification_evidence).toHaveLength(13);
    expect(report.detected_failures).toEqual([]);
    expect(validation.valid).toBe(true);
    expect(replayAdaptiveMemoryCertification(report)).toBe(true);
  });

  it("produces deterministic report, matrix, evidence, readiness, replay, and integrity hashes", () => {
    const first = runAdaptiveMemoryCertification();
    const second = runAdaptiveMemoryCertification();

    expect(first.report_hash).toBe(second.report_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.readiness.readiness_hash).toBe(second.readiness.readiness_hash);
    expect(first.replay.replay_hash).toBe(second.replay.replay_hash);
    expect(first.validation_matrix.map((item) => item.test_hash)).toEqual(second.validation_matrix.map((item) => item.test_hash));
    expect(first.certification_evidence.map((item) => item.evidence_hash)).toEqual(second.certification_evidence.map((item) => item.evidence_hash));
  });

  it("generates the required certification reports", () => {
    const report = runAdaptiveMemoryCertification();

    expect(report.adaptive_memory_certification_report.outcome).toBe("PASS");
    expect(report.governance_compliance_report.outcome).toBe("PASS");
    expect(report.replay_validation_report.outcome).toBe("PASS");
    expect(report.tenant_isolation_report.outcome).toBe("PASS");
    expect(report.security_assessment_report.outcome).toBe("PASS");
    expect(report.production_readiness_report.outcome).toBe("PASS");
  });

  it("treats minor non-critical gaps as conditional pass without production approval", () => {
    const report = runAdaptiveMemoryCertification({ scenario: "MINOR_DOCUMENTATION_GAP" });
    const validation = validateAdaptiveMemoryCertification(report);

    expect(report.certification_state).toBe("CONDITIONAL_PASS");
    expect(report.production_deployment_authorized).toBe(false);
    expect(report.adaptive_memory_reuse_authorized).toBe(false);
    expect(report.readiness.blocked_operations).toContain("production deployment");
    expect(validation.valid).toBe(false);
  });

  it.each([
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED"],
    ["REPLAY_NONDETERMINISTIC", "REPLAY_NONDETERMINISTIC"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_UNEXPLAINED"],
    ["QUALIFICATION_BYPASS", "MEMORY_QUALIFICATION_BYPASSED"],
    ["UNAUTHORIZED_REUSE", "UNAUTHORIZED_REUSE_SUCCEEDED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["CROSS_TENANT_LEAKAGE", "CROSS_TENANT_LEAKAGE_DETECTED"],
    ["HIDDEN_SHARING", "HIDDEN_SHARING_DETECTED"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION_SUCCEEDED"],
    ["SECURITY_BYPASS", "SECURITY_CONTROLS_BYPASSED"],
    ["REPLAY_MANIPULATION", "REPLAY_MANIPULATION_SUCCEEDED"],
    ["MEMORY_POISONING", "MEMORY_POISONING_SUCCEEDED"],
    ["LEDGER_MODIFICATION", "LEDGER_MODIFICATION_DETECTED"],
    ["APPEND_ONLY_VIOLATION", "APPEND_ONLY_GUARANTEE_VIOLATED"],
    ["INTEGRITY_HASH_INCONSISTENCY", "INTEGRITY_HASHES_INCONSISTENT"],
    ["DETERMINISM_VIOLATION", "DETERMINISTIC_BEHAVIOR_VIOLATED"],
    ["EVIDENCE_LINEAGE_INCOMPLETE", "EVIDENCE_LINEAGE_INCOMPLETE"],
    ["LIFECYCLE_HISTORY_DELETE", "LIFECYCLE_DELETES_HISTORICAL_MEMORY"],
    ["OPERATOR_AUTHORITY_BYPASS", "OPERATOR_AUTHORITY_BYPASSED"],
  ] as const)("fails closed for %s", (scenario: AdaptiveMemoryCertificationScenario, failure: AdaptiveMemoryCertificationFailure) => {
    const report = runAdaptiveMemoryCertification({ scenario });

    expect(report.certification_state).toBe("FAIL");
    expect(report.production_deployment_authorized).toBe(false);
    expect(report.adaptive_memory_reuse_authorized).toBe(false);
    expect(report.operator_required).toBe(true);
    expect(report.detected_failures).toContain(failure);
    expect(validateAdaptiveMemoryCertification(report).valid).toBe(false);
  });

  it("detects report tampering through certification validation", () => {
    const report = runAdaptiveMemoryCertification();
    const tampered = {
      ...report,
      validation_matrix: [
        {
          ...report.validation_matrix[0],
          actual: "FAIL" as const,
        },
        ...report.validation_matrix.slice(1),
      ],
    };

    expect(computeAdaptiveMemoryCertificationReportHash(tampered)).not.toBe(report.report_hash);
    expect(validateAdaptiveMemoryCertification(tampered).report_hash_valid).toBe(false);
    expect(replayAdaptiveMemoryCertification(tampered)).toBe(false);
  });
});
