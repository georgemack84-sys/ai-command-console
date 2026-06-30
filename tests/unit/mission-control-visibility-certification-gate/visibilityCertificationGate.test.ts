import { describe, expect, it, vi } from "vitest";
import {
  buildVisibilityCertificationObservabilitySurface,
  computeVisibilityCertificationReportHash,
  getVisibilityCertificationContract,
  runVisibilityCertification,
  validateVisibilityCertificationReport,
} from "@/services/mission-control-visibility-certification-gate";
import type { VisibilityCertificationFailure, VisibilityCertificationScenario, VisibilityCertificationState } from "@/types/mission-control-visibility-certification-gate";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 8J.5 Visibility Certification Gate", () => {
  it("defines the visibility certification doctrine and states", () => {
    const contract = getVisibilityCertificationContract();

    expect(contract.doctrine.schema_version).toBe("mission-control-visibility-certification-gate/v8J.5");
    expect(contract.doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.principles).toContain("fail-closed");
    expect(contract.doctrine.principles).toContain("phase-8k-readiness");
    expect(contract.doctrine.certification_scope).toContain("Replay Investigation Workspace");
    expect(contract.doctrine.certification_scope).toContain("Intervention Visibility");
  });

  it("certifies the complete 8J visibility subsystem for Phase 8K when all tests pass", () => {
    const report = runVisibilityCertification();
    const validation = validateVisibilityCertificationReport(report);

    expect(report.phase_version).toBe("8J.5");
    expect(report.phase).toBe("8J");
    expect(report.certification_state).toBe("PASS");
    expect(report.overall_result).toBe("PASS");
    expect(report.operator_approval_status).toBe("APPROVED_FOR_PHASE_8K");
    expect(report.phase_8k_authorized).toBe(true);
    expect(report.production_ready).toBe(true);
    expect(report.tests_executed).toBe(41);
    expect(report.tests_failed).toBe(0);
    expect(report.certification_tests.every((test) => test.passed)).toBe(true);
    expect(report.determinism_score).toBe(1);
    expect(report.visibility_score).toBe(1);
    expect(report.replay_score).toBe(1);
    expect(report.integrity_score).toBe(1);
    expect(report.lineage_score).toBe(1);
    expect(report.governance_score).toBe(1);
    expect(report.security_score).toBe(1);
    expect(validation.certified).toBe(true);
    expect(validation.phase_8k_authorized).toBe(true);
  });

  it("allows conditional pass only for non-critical presentation gaps", () => {
    const report = runVisibilityCertification({ scenario: "MINOR_PRESENTATION_GAP" });
    const validation = validateVisibilityCertificationReport(report);

    expect(report.certification_state).toBe("CONDITIONAL_PASS");
    expect(report.operator_approval_status).toBe("APPROVED_FOR_REMEDIATION");
    expect(report.phase_8k_authorized).toBe(false);
    expect(report.production_ready).toBe(false);
    expect(report.warnings).toContain("MINOR_PRESENTATION_GAP");
    expect(report.failed_tests.every((test) => !test.mandatory)).toBe(true);
    expect(validation.validation_state).toBe("VALID");
    expect(validation.certified).toBe(false);
  });

  it.each([
    ["MISSING_EXECUTION_EVENTS", "EXECUTION_TIMELINE_INCOMPLETE"],
    ["HIDDEN_AUTONOMY_STATE", "AUTONOMY_STATE_HIDDEN"],
    ["HIDDEN_GOVERNANCE_STATUS", "GOVERNANCE_STATUS_HIDDEN"],
    ["CONFIDENCE_MISMATCH", "CONFIDENCE_VISIBILITY_MISMATCH"],
    ["HIDDEN_RISK", "RISK_INDICATORS_HIDDEN"],
    ["HIDDEN_INTERVENTION", "INTERVENTION_HISTORY_HIDDEN"],
    ["PLANNING_GRAPH_MISMATCH", "PLANNING_GRAPH_NOT_DETERMINISTIC"],
    ["DELEGATION_MISMATCH", "DELEGATION_GRAPH_NOT_DETERMINISTIC"],
    ["GRAPH_RECONSTRUCTION_MISMATCH", "GRAPH_RECONSTRUCTION_MISMATCH"],
    ["REPLAY_VISUALIZATION_MISMATCH", "REPLAY_VISUALIZATION_MISMATCH"],
    ["LINEAGE_BREAK", "LINEAGE_BREAK_DETECTED"],
    ["HIDDEN_INTEGRITY_STATUS", "INTEGRITY_STATUS_HIDDEN"],
    ["INCONSISTENT_DASHBOARD_STATE", "DASHBOARD_STATE_INCONSISTENT"],
    ["REFERENCE_MUTATION", "REFERENCE_MUTATION_DETECTED"],
    ["CROSS_TENANT_VISIBILITY", "CROSS_TENANT_VISIBILITY_DETECTED"],
    ["UNAUTHORIZED_DASHBOARD_ACCESS", "UNAUTHORIZED_DASHBOARD_ACCESS"],
    ["EXECUTION_CONTROLS_EXPOSED", "EXECUTION_CONTROLS_EXPOSED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH"],
    ["HIDDEN_AUTONOMOUS_ACTIVITY", "HIDDEN_AUTONOMOUS_ACTIVITY"],
  ] as readonly [VisibilityCertificationScenario, VisibilityCertificationFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const report = runVisibilityCertification({ scenario });

      expect(report.certification_state).toBe("FAIL" satisfies VisibilityCertificationState);
      expect(report.operator_approval_status).toBe("BLOCKED");
      expect(report.phase_8k_authorized).toBe(false);
      expect(report.production_ready).toBe(false);
      expect(report.detected_findings).toContain(failure);
      expect(report.failed_tests.map((test) => test.failure_reason)).toContain(failure);
      expect(validateVisibilityCertificationReport(report).validation_state).toBe("INVALID");
    },
  );

  it("produces complete subsystem evidence and a stable report hash", () => {
    const report = runVisibilityCertification();

    expect(report.certification_evidence.visibility_contract_hash).toBeTruthy();
    expect(report.certification_evidence.dashboard_hash).toBeTruthy();
    expect(report.certification_evidence.graph_engine_hash).toBeTruthy();
    expect(report.certification_evidence.replay_workspace_hash).toBeTruthy();
    expect(report.certification_report.evidence_references).toEqual([
      report.certification_evidence.visibility_contract_hash,
      report.certification_evidence.dashboard_hash,
      report.certification_evidence.graph_engine_hash,
      report.certification_evidence.replay_workspace_hash,
    ]);
    expect(report.certification_report.immutable_checksum).toBeTruthy();
    expect(report.report_hash).toBe(computeVisibilityCertificationReportHash(report));
    expect(runVisibilityCertification().report_hash).toBe(report.report_hash);
  });

  it("exposes operator certification metrics", () => {
    const surface = buildVisibilityCertificationObservabilitySurface(runVisibilityCertification({ scenario: "CROSS_TENANT_VISIBILITY" }));

    expect(surface.certification_state).toBe("FAIL");
    expect(surface.failures).toContain("CROSS_TENANT_VISIBILITY_DETECTED");
    expect(surface.operator_approval_status).toBe("BLOCKED");
    expect(surface.phase_8k_authorized).toBe(false);
    expect(surface.production_ready).toBe(false);
    expect(surface.failed_tests).toBeGreaterThan(0);
    expect(surface.security_score).toBeLessThan(1);
  });
});
