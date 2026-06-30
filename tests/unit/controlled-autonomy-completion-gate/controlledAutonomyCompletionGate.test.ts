import { describe, expect, it, vi } from "vitest";
import {
  buildControlledAutonomyCompletionObservabilitySurface,
  computeControlledAutonomyCompletionReportHash,
  getControlledAutonomyCompletionContract,
  runControlledAutonomyCompletionGate,
  validateControlledAutonomyCompletionReport,
} from "@/services/controlled-autonomy-completion-gate";
import type { ControlledAutonomyCompletionFailure, ControlledAutonomyCompletionScenario } from "@/types/controlled-autonomy-completion-gate";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 8L Controlled Autonomy Completion Gate", () => {
  it("defines completion doctrine, decision states, and completion matrix", () => {
    const contract = getControlledAutonomyCompletionContract();

    expect(contract.doctrine.completion_version).toBe("controlled-autonomy-completion-gate/v8L");
    expect(contract.doctrine.decision_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.principles).toContain("production-ready-pass-only");
    expect(contract.doctrine.phase_9_authority).toBe("PASS-only");
    expect(contract.doctrine.validation_matrix.length).toBe(21);
    expect(contract.doctrine.validation_matrix).toContain("Certification Suite");
  });

  it("returns PASS when all Phase 8 subsystems and final certification are production ready", () => {
    const report = runControlledAutonomyCompletionGate();
    const validation = validateControlledAutonomyCompletionReport(report);

    expect(report.phase).toBe("8L");
    expect(report.completion_state).toBe("PASS");
    expect(report.production_ready).toBe(true);
    expect(report.phase_9_authorized).toBe(true);
    expect(report.completion_score).toBe(1);
    expect(report.final_autonomy_certification.overall_state).toBe("PASS");
    expect(report.validation_matrix.length).toBe(21);
    expect(report.validation_matrix.every((item) => item.validation === "PASS")).toBe(true);
    expect(report.detected_failures).toEqual([]);
    expect(report.operator_required).toBe(false);
    expect(validation.valid).toBe(true);
    expect(validation.phase_9_authorized).toBe(true);
  });

  it("produces production readiness assessment, deliverables, and immutable evidence", () => {
    const report = runControlledAutonomyCompletionGate();

    expect(report.production_readiness_assessment.production_ready).toBe(true);
    expect(report.production_readiness_assessment.phase_9_authorized).toBe(true);
    expect(report.production_readiness_assessment.allowed_operations).toContain("phase 9 progression");
    expect(report.production_readiness_assessment.prohibited_operations).toEqual([]);
    expect(report.deliverables).toContain("Production Certification Package");
    expect(report.deliverables).toContain("Integrated Autonomy Validation Matrix");
    expect(report.completion_evidence.every((item) => item.evidence_reference && item.replay_reference && item.lineage_reference && item.integrity_hash && item.immutable)).toBe(true);
  });

  it.each([
    ["MINOR_DOCUMENTATION_GAP", "MINOR_DOCUMENTATION_GAP"],
    ["MINOR_UI_IMPROVEMENT", "MINOR_UI_IMPROVEMENT"],
    ["PERFORMANCE_OPTIMIZATION", "PERFORMANCE_OPTIMIZATION_REMAINING"],
  ] as readonly [ControlledAutonomyCompletionScenario, ControlledAutonomyCompletionFailure][])(
    "allows conditional pass for %s while blocking production",
    (scenario, failure) => {
      const report = runControlledAutonomyCompletionGate({ scenario });
      const validation = validateControlledAutonomyCompletionReport(report);

      expect(report.completion_state).toBe("CONDITIONAL_PASS");
      expect(report.production_ready).toBe(false);
      expect(report.phase_9_authorized).toBe(false);
      expect(report.detected_failures).toContain(failure);
      expect(report.production_readiness_assessment.allowed_operations).toContain("validation");
      expect(report.production_readiness_assessment.prohibited_operations).toContain("production autonomy");
      expect(validation.valid).toBe(false);
    },
  );

  it.each([
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["GOVERNANCE_POLICY_IGNORED", "GOVERNANCE_POLICIES_IGNORED"],
    ["UNAUTHORIZED_GOVERNANCE_MODIFICATION", "UNAUTHORIZED_GOVERNANCE_MODIFICATION"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED"],
    ["CONSTITUTIONAL_OVERRIDE_ATTEMPTED", "CONSTITUTIONAL_OVERRIDE_ATTEMPTED"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_OCCURRED"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION_DETECTED"],
    ["UNAUTHORIZED_DELEGATION", "UNAUTHORIZED_DELEGATION"],
    ["UNAUTHORIZED_EXECUTION", "UNAUTHORIZED_EXECUTION"],
    ["NONDETERMINISTIC_PLANNING", "NONDETERMINISTIC_PLANNING_DETECTED"],
    ["PLANNING_REPLAY_MISMATCH", "PLANNING_REPLAY_MISMATCH"],
    ["HIDDEN_EXECUTION", "HIDDEN_EXECUTION_DISCOVERED"],
    ["ROLLBACK_FAILURE", "ROLLBACK_FAILURE"],
    ["RUNTIME_SUPERVISION_FAILURE", "RUNTIME_SUPERVISION_FAILURE"],
    ["DRIFT_UNDETECTED", "DRIFT_UNDETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_EXISTS"],
    ["REPLAY_CORRUPTION", "REPLAY_CORRUPTION"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["TAMPERING_DETECTED", "TAMPERING_DETECTED"],
    ["HASH_MISMATCH", "HASH_MISMATCH"],
    ["OPERATOR_VISIBILITY_INCOMPLETE", "OPERATOR_VISIBILITY_INCOMPLETE"],
    ["HIDDEN_PLANNING", "HIDDEN_PLANNING"],
    ["HIDDEN_DELEGATION", "HIDDEN_DELEGATION"],
    ["HIDDEN_SUPERVISION", "HIDDEN_SUPERVISION"],
    ["HIDDEN_GOVERNANCE_DECISIONS", "HIDDEN_GOVERNANCE_DECISIONS"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE"],
    ["CROSS_TENANT_EXECUTION", "CROSS_TENANT_EXECUTION"],
    ["CROSS_TENANT_REPLAY", "CROSS_TENANT_REPLAY"],
    ["CROSS_TENANT_VISIBILITY", "CROSS_TENANT_VISIBILITY"],
    ["CERTIFICATION_SUITE_FAILS", "CERTIFICATION_SUITE_FAILED"],
    ["DETERMINISTIC_CERTIFICATION_FAILS", "DETERMINISTIC_CERTIFICATION_FAILED"],
    ["GOVERNANCE_CERTIFICATION_FAILS", "GOVERNANCE_CERTIFICATION_FAILED"],
    ["REPLAY_CERTIFICATION_FAILS", "REPLAY_CERTIFICATION_FAILED"],
    ["INTEGRITY_CERTIFICATION_FAILS", "INTEGRITY_CERTIFICATION_FAILED"],
  ] as readonly [ControlledAutonomyCompletionScenario, ControlledAutonomyCompletionFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const report = runControlledAutonomyCompletionGate({ scenario });
      const validation = validateControlledAutonomyCompletionReport(report);

      expect(report.completion_state).toBe("FAIL");
      expect(report.production_ready).toBe(false);
      expect(report.phase_9_authorized).toBe(false);
      expect(report.operator_required).toBe(true);
      expect(report.detected_failures).toContain(failure);
      expect(report.validation_matrix.some((item) => item.validation === "FAIL")).toBe(true);
      expect(validation.valid).toBe(false);
      expect(validation.failures).toContain(failure);
    },
  );

  it("repeats completion reports with stable hashes", () => {
    const first = runControlledAutonomyCompletionGate();
    const second = runControlledAutonomyCompletionGate();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.validation_matrix.map((item) => item.matrix_hash)).toEqual(first.validation_matrix.map((item) => item.matrix_hash));
    expect(first.report_hash).toBe(computeControlledAutonomyCompletionReportHash(first));
  });

  it("exposes completion observability", () => {
    const surface = buildControlledAutonomyCompletionObservabilitySurface(runControlledAutonomyCompletionGate({ scenario: "CROSS_TENANT_EXECUTION" }));

    expect(surface.completion_state).toBe("FAIL");
    expect(surface.failures).toContain("CROSS_TENANT_EXECUTION");
    expect(surface.risks).toContain("CRITICAL:CROSS_TENANT_EXECUTION");
    expect(surface.production_ready).toBe(false);
    expect(surface.phase_9_authorized).toBe(false);
    expect(surface.failed_items).toBeGreaterThan(0);
  });
});
