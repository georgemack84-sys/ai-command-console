import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceReplayCertificationObservabilitySurface,
  computeGovernanceReplayCertificationReportHash,
  getGovernanceReplayCertificationContract,
  runGovernanceReplayCertification,
  validateGovernanceReplayCertificationReport,
} from "@/services/governance-replay-certification";
import type { GovernanceReplayCertificationScenario } from "@/types/governance-replay-certification";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7H.5 Governance Replay Certification Gate", () => {
  it("defines certification doctrine and passes the baseline replay gate", () => {
    const contract = getGovernanceReplayCertificationContract();
    expect(contract.doctrine.principles).toContain("deterministic-replay");
    expect(contract.doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.report.certification_state).toBe("PASS");
    expect(contract.validation.certified).toBe(true);
    expect(contract.observability.operator_approval_status).toBe("APPROVED_FOR_PRODUCTION");
  });

  it("generates permanent certification evidence and reproducible report hashes", () => {
    const report = runGovernanceReplayCertification();
    expect(report.schema_version).toBe("governance-replay-certification/v7H.5");
    expect(report.certification_evidence.replay_hashes.length).toBeGreaterThan(0);
    expect(report.truth_ledger_record_reference).toContain("truth-ledger");
    expect(report.governance_ledger_record_reference).toContain("governance-ledger");
    expect(computeGovernanceReplayCertificationReportHash(report)).toBe(report.report_hash);
  });

  it("executes the full replay certification suite across all categories", () => {
    const report = runGovernanceReplayCertification();
    const categories = new Set(report.executed_test_results.map((item) => item.category));
    expect(categories).toContain("CONTRACT");
    expect(categories).toContain("INPUT_RECONSTRUCTION");
    expect(categories).toContain("STATE_RECONSTRUCTION");
    expect(categories).toContain("OUTPUT_VERIFICATION");
    expect(categories).toContain("SECURITY");
    expect(report.executed_test_results.every((item) => item.passed)).toBe(true);
  });

  it("supports conditional pass for non-critical reporting gaps", () => {
    const report = runGovernanceReplayCertification({ scenario: "MINOR_REPORTING_GAP" });
    const validation = validateGovernanceReplayCertificationReport(report);
    expect(report.certification_state).toBe("CONDITIONAL_PASS");
    expect(report.operator_approval_status).toBe("APPROVED_FOR_GOVERNANCE_REVIEW");
    expect(validation.validation_state).toBe("VALID");
    expect(validation.certified).toBe(false);
  });

  it("fails closed for critical certification scenarios", () => {
    const scenarios: readonly Exclude<GovernanceReplayCertificationScenario, "BASELINE" | "MINOR_REPORTING_GAP">[] = [
      "MISSING_REPLAY_CONTRACT",
      "REPLAY_IDENTITY_MODIFIED",
      "INCOMPLETE_INPUT_RECONSTRUCTION",
      "STATE_RECONSTRUCTION_MISMATCH",
      "REPLAY_OUTPUT_MISMATCH",
      "GOVERNANCE_DECISION_MISMATCH",
      "POLICY_EVALUATION_MISMATCH",
      "COMPLIANCE_REPLAY_MISMATCH",
      "RISK_REPLAY_MISMATCH",
      "RECOMMENDATION_REPLAY_MISMATCH",
      "ESCALATION_REPLAY_MISMATCH",
      "EXPLANATION_MISMATCH",
      "EVIDENCE_CHAIN_MISMATCH",
      "POLICY_INFLUENCE_MISMATCH",
      "CONFIDENCE_MISMATCH",
      "LINEAGE_DISCONTINUITY",
      "REPLAY_ORDERING_CHANGED",
      "REPLAY_HASH_MISMATCH",
      "INTEGRITY_VERIFICATION_FAILS",
      "CONSTITUTIONAL_VERSION_MISMATCH",
      "AUTHORITY_VALIDATION_MISMATCH",
      "LIVE_DATA_DEPENDENCY",
      "HIDDEN_EXECUTION_STATE",
      "UNDOCUMENTED_DEPENDENCY",
      "REPLAY_INCONSISTENCY",
      "CROSS_TENANT_REPLAY",
      "MISSING_AUDIT_RECORDS",
      "INCOMPLETE_CERTIFICATION_EVIDENCE",
    ];
    for (const scenario of scenarios) {
      const report = runGovernanceReplayCertification({ scenario });
      const validation = validateGovernanceReplayCertificationReport(report);
      expect(report.certification_state, scenario).toBe("FAIL");
      expect(report.operator_approval_status, scenario).toBe("BLOCKED");
      expect(validation.certified, scenario).toBe(false);
      expect(report.detected_findings.length, scenario).toBeGreaterThan(0);
    }
  }, 420000);

  it("exposes operator observability for the certification gate", () => {
    const surface = buildGovernanceReplayCertificationObservabilitySurface();
    expect(surface.certification_state).toBe("PASS");
    expect(surface.failed_tests).toBe(0);
    expect(surface.total_tests).toBeGreaterThan(0);
    expect(surface.advisory_only_notice).toContain("advisory-only");
  });
});
