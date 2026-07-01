import { describe, expect, it, vi } from "vitest";
import {
  buildLineageCertificationObservabilitySurface,
  computeLineageCertificationReportHash,
  getLineageCertificationContract,
  runLineageCertification,
  validateLineageCertificationReport,
} from "@/services/lineage-certification";
import type { LineageCertificationScenario } from "@/types/lineage-certification";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7G.5 Lineage Certification Gate", () => {
  it("defines certification doctrine and passes the baseline gate", () => {
    const contract = getLineageCertificationContract();
    expect(contract.doctrine.principles).toContain("constitution-first");
    expect(contract.doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.report.certification_state).toBe("PASS");
    expect(contract.observability.failed_tests).toBe(0);
  });

  it("generates immutable certification reports and evidence packages", () => {
    const report = runLineageCertification();
    expect(report.schema_version).toBe("lineage-certification-gate/v7G.5");
    expect(report.executed_test_results.length).toBeGreaterThan(0);
    expect(report.evidence_package.evidence_package_hash).toBeTruthy();
    expect(report.operator_approval_status).toBe("APPROVED_FOR_PRODUCTION");
    expect(computeLineageCertificationReportHash(report)).toBe(report.report_hash);
  });

  it("validates replay matrix and report hash", () => {
    const report = runLineageCertification();
    const validation = validateLineageCertificationReport(report);
    expect(validation.validation_state).toBe("PASS");
    expect(validation.replay_matrix_valid).toBe(true);
    expect(report.replay_matrix.every((item) => item.actual_result === "IDENTICAL")).toBe(true);
  });

  it("produces category results for the full 7G stack", () => {
    const report = runLineageCertification();
    expect(report.contract_validation_results.length).toBeGreaterThan(0);
    expect(report.policy_lineage_results.length).toBeGreaterThan(0);
    expect(report.decision_influence_results.length).toBeGreaterThan(0);
    expect(report.explainability_results.length).toBeGreaterThan(0);
    expect(report.replay_results.length).toBeGreaterThan(0);
    expect(report.governance_results.length).toBeGreaterThan(0);
    expect(report.tenant_isolation_results.length).toBeGreaterThan(0);
    expect(report.integrity_results.length).toBeGreaterThan(0);
  });

  it("supports conditional pass for non-critical metadata gaps", () => {
    const report = runLineageCertification({ scenario: "MINOR_METADATA_GAP" });
    expect(report.certification_state).toBe("CONDITIONAL_PASS");
    expect(report.operator_approval_status).toBe("APPROVED_FOR_CONTROLLED_TESTING");
    expect(report.warnings.length).toBeGreaterThan(0);
  });

  it("fails closed for critical certification scenarios", () => {
    const scenarios: readonly LineageCertificationScenario[] = [
      "MISSING_CONTRACT",
      "POLICY_REPLAY_MISMATCH",
      "POLICY_INHERITANCE_MISMATCH",
      "POLICY_DEPENDENCY_MISMATCH",
      "CONSTITUTIONAL_PRECEDENCE_VIOLATION",
      "SUPERSESSION_MISMATCH",
      "HIDDEN_INFLUENCE",
      "CONTRIBUTION_MISMATCH",
      "INFLUENCE_GRAPH_MISMATCH",
      "UNRESOLVED_CONFLICT",
      "INCOMPLETE_EXPLANATION",
      "EXPLANATION_REPLAY_MISMATCH",
      "UNSUPPORTED_INFERENCE",
      "LINEAGE_REPLAY_MISMATCH",
      "TRUTH_LEDGER_MISMATCH",
      "HASH_VERIFICATION_FAILED",
      "CROSS_TENANT",
      "IMMUTABLE_MUTATION",
    ];
    for (const scenario of scenarios) {
      const report = runLineageCertification({ scenario });
      expect(report.certification_state, scenario).toBe("FAIL");
      expect(report.failures.length, scenario).toBeGreaterThan(0);
      expect(report.operator_approval_status, scenario).toBe("BLOCKED");
    }
  }, 240000);

  it("exposes operator observability", () => {
    const surface = buildLineageCertificationObservabilitySurface();
    expect(surface.certification_state).toBe("PASS");
    expect(surface.failed_tests).toBe(0);
    expect(surface.replay_matrix_state).toBe("IDENTICAL");
    expect(surface.advisory_only_notice).toContain("advisory-only");
  });
});
