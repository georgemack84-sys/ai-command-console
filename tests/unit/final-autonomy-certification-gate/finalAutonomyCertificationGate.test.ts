import { describe, expect, it, vi } from "vitest";
import {
  buildFinalAutonomyCertificationObservabilitySurface,
  computeFinalAutonomyCertificationReportHash,
  getFinalAutonomyCertificationContract,
  runFinalAutonomyCertification,
  validateFinalAutonomyCertificationReport,
} from "@/services/final-autonomy-certification-gate";
import type { FinalAutonomyFailure, FinalAutonomyScenario } from "@/types/final-autonomy-certification-gate";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 8K.5 Final Autonomy Certification Gate", () => {
  it("defines final autonomy certification doctrine and PASS-only Phase 9 authority", () => {
    const contract = getFinalAutonomyCertificationContract();

    expect(contract.doctrine.certification_version).toBe("final-autonomy-certification-gate/v8K.5");
    expect(contract.doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.principles).toContain("deterministic-by-design");
    expect(contract.doctrine.principles).toContain("fail-closed");
    expect(contract.doctrine.phase_9_authority).toBe("PASS-only");
    expect(contract.doctrine.lifecycle).toContain("CERTIFIED");
  });

  it("certifies Phase 8 and authorizes Phase 9 only on a clean PASS", () => {
    const report = runFinalAutonomyCertification();
    const validation = validateFinalAutonomyCertificationReport(report);

    expect(report.certification_version).toBe("final-autonomy-certification-gate/v8K.5");
    expect(report.phase).toBe("8");
    expect(report.subphase).toBe("8K.5");
    expect(report.overall_state).toBe("PASS");
    expect(report.overall_score).toBe(1);
    expect(report.phase_9_authorized).toBe(true);
    expect(report.production_deployment_authorized).toBe(true);
    expect(report.operator_required).toBe(false);
    expect(report.approver).toBeTruthy();
    expect(report.certification_tests.length).toBe(46);
    expect(report.certification_tests.every((test) => test.passed)).toBe(true);
    expect(report.detected_failures).toEqual([]);
    expect(validation.valid).toBe(true);
    expect(validation.phase_9_authorized).toBe(true);
  });

  it("aggregates certification evidence from 8K.1 through 8K.4", () => {
    const report = runFinalAutonomyCertification();

    expect(report.certification_contract.certification_decision).toBe("PASS");
    expect(report.deterministic_validation.deterministic_result).toBe("DETERMINISTIC");
    expect(report.security_validation.overall_security_score).toBe(1);
    expect(report.replay_validation.overall_score).toBe(1);
    expect(report.integrity_validation.integrity_score).toBe(1);
    expect(report.evidence.map((item) => item.source)).toEqual(["autonomy-certification-contract", "deterministic-validation-engine", "security-governance-validation-engine", "replay-integrity-certification-engine"]);
    expect(report.evidence.every((item) => item.evidence_reference && item.replay_reference && item.lineage_reference && item.integrity_hash && item.immutable)).toBe(true);
  });

  it("allows conditional pass only for non-critical metadata refinements and blocks Phase 9", () => {
    const report = runFinalAutonomyCertification({ scenario: "MINOR_METADATA_GAP" });
    const validation = validateFinalAutonomyCertificationReport(report);

    expect(report.overall_state).toBe("CONDITIONAL_PASS");
    expect(report.phase_9_authorized).toBe(false);
    expect(report.production_deployment_authorized).toBe(false);
    expect(report.operator_required).toBe(true);
    expect(report.detected_failures).toContain("MINOR_METADATA_GAP");
    expect(report.certification_tests.filter((test) => !test.passed).every((test) => !test.mandatory)).toBe(true);
    expect(validation.valid).toBe(false);
  });

  it.each([
    ["PLANNING_NONDETERMINISTIC", "PLANNING_NONDETERMINISTIC"],
    ["ORCHESTRATION_NONDETERMINISTIC", "ORCHESTRATION_NONDETERMINISTIC"],
    ["DELEGATION_NONDETERMINISTIC", "DELEGATION_NONDETERMINISTIC"],
    ["SUPERVISION_NONDETERMINISTIC", "SUPERVISION_NONDETERMINISTIC"],
    ["REPLAY_RECONSTRUCTION_FAILURE", "REPLAY_RECONSTRUCTION_INCOMPLETE"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["HASH_MISMATCH", "INTEGRITY_HASHES_NOT_REPRODUCIBLE"],
    ["LINEAGE_BREAK", "LINEAGE_BREAK_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED"],
    ["AUTHORITY_VIOLATION", "AUTHORITY_ENFORCEMENT_FAILED"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION_DETECTED"],
    ["UNAUTHORIZED_EXECUTION", "UNAUTHORIZED_EXECUTION_DETECTED"],
    ["POLICY_COMPLIANCE_FAILURE", "POLICY_COMPLIANCE_FAILED"],
    ["HIDDEN_EXECUTION", "HIDDEN_EXECUTION_DETECTED"],
    ["HIDDEN_GOVERNANCE_STATE", "HIDDEN_GOVERNANCE_STATE_DETECTED"],
    ["HIDDEN_AUTHORITY_STATE", "HIDDEN_AUTHORITY_STATE_DETECTED"],
    ["CONFIDENCE_MISMATCH", "CONFIDENCE_MISMATCH_DETECTED"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILED"],
    ["CROSS_TENANT_EXECUTION", "CROSS_TENANT_EXECUTION_DETECTED"],
    ["CROSS_TENANT_REPLAY", "CROSS_TENANT_REPLAY_DETECTED"],
    ["CROSS_TENANT_VISIBILITY", "CROSS_TENANT_VISIBILITY_DETECTED"],
    ["FAIL_OPEN_BEHAVIOR", "FAIL_OPEN_BEHAVIOR_DETECTED"],
    ["INCOMPLETE_EVIDENCE", "CERTIFICATION_EVIDENCE_INCOMPLETE"],
    ["MUTABLE_EVIDENCE", "CERTIFICATION_EVIDENCE_MUTABLE"],
  ] as readonly [FinalAutonomyScenario, FinalAutonomyFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const report = runFinalAutonomyCertification({ scenario });
      const validation = validateFinalAutonomyCertificationReport(report);

      expect(report.overall_state).toBe("FAIL");
      expect(report.phase_9_authorized).toBe(false);
      expect(report.production_deployment_authorized).toBe(false);
      expect(report.operator_required).toBe(true);
      expect(report.detected_failures).toContain(failure);
      expect(report.certification_tests.map((test) => test.failure_reason)).toContain(failure);
      expect(validation.valid).toBe(false);
      expect(validation.failures).toContain(failure);
    },
  );

  it("records stable immutable final certification hashes", () => {
    const first = runFinalAutonomyCertification();
    const second = runFinalAutonomyCertification();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.evidence.map((item) => item.evidence_hash)).toEqual(first.evidence.map((item) => item.evidence_hash));
    expect(first.report_hash).toBe(computeFinalAutonomyCertificationReportHash(first));
  });

  it("exposes final certification observability", () => {
    const surface = buildFinalAutonomyCertificationObservabilitySurface(runFinalAutonomyCertification({ scenario: "FAIL_OPEN_BEHAVIOR" }));

    expect(surface.overall_state).toBe("FAIL");
    expect(surface.failures).toContain("FAIL_OPEN_BEHAVIOR_DETECTED");
    expect(surface.risks).toContain("CRITICAL:FAIL_OPEN_BEHAVIOR_DETECTED");
    expect(surface.phase_9_authorized).toBe(false);
    expect(surface.production_deployment_authorized).toBe(false);
    expect(surface.operator_required).toBe(true);
    expect(surface.failed_tests).toBeGreaterThan(0);
  });
});
