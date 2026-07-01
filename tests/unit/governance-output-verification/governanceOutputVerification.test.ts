import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceOutputAuditLog,
  buildGovernanceOutputObservabilitySurface,
  computeGovernanceOutputVerificationReportHash,
  getGovernanceOutputVerificationContract,
  validateGovernanceOutputVerificationReport,
  verifyGovernanceOutputs,
} from "@/services/governance-output-verification";
import type { GovernanceOutputVerificationScenario } from "@/types/governance-output-verification";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7H.4 Governance Output Verification", () => {
  it("defines output verification doctrine and verifies the baseline replay outputs", () => {
    const contract = getGovernanceOutputVerificationContract();
    expect(contract.doctrine.principles).toContain("exact-output-match");
    expect(contract.doctrine.verification_states).toEqual(["VERIFIED", "MISMATCH", "INCOMPLETE", "INVALID"]);
    expect(contract.report.schema_version).toBe("governance-output-verification/v7H.4");
    expect(contract.validation.validation_state).toBe("VALID");
    expect(contract.validation.replay_outputs_verified).toBe(true);
    expect(contract.observability.certification_recommendation).toBe("CERTIFY_REPLAY");
  });

  it("compares every required governance output category exactly", () => {
    const report = verifyGovernanceOutputs();
    expect(report.verification_state).toBe("VERIFIED");
    expect(report.comparisons).toHaveLength(10);
    expect(report.comparisons.every((item) => item.match)).toBe(true);
    expect(report.governance_decision_comparison.category).toBe("GOVERNANCE_DECISION");
    expect(report.integrity_comparison.category).toBe("INTEGRITY");
  });

  it("preserves report hash, audit evidence, and certification recommendation", () => {
    const report = verifyGovernanceOutputs();
    expect(computeGovernanceOutputVerificationReportHash(report)).toBe(report.verification_report_hash);
    expect(report.certification_recommendation).toBe("CERTIFY_REPLAY");
    const audit = buildGovernanceOutputAuditLog(report);
    expect(audit[0].integrity_status).toBe("VERIFIED");
    expect(audit[0].compared_artifacts).toContain("CONFIDENCE");
  });

  it("fails closed when the replay state package is invalid", () => {
    const report = verifyGovernanceOutputs({ scenario: "STATE_PACKAGE_INVALID" });
    const validation = validateGovernanceOutputVerificationReport(report);
    expect(report.verification_state).toBe("INVALID");
    expect(report.certification_recommendation).toBe("BLOCK_CERTIFICATION");
    expect(validation.validation_state).toBe("INVALID");
  });

  it("fails closed for every output verification mismatch condition", () => {
    const scenarios: readonly Exclude<GovernanceOutputVerificationScenario, "BASELINE" | "STATE_PACKAGE_INVALID">[] = [
      "GOVERNANCE_DECISION_DIFFERS",
      "POLICY_EVALUATION_MISMATCH",
      "COMPLIANCE_RESULT_DIFFERS",
      "RISK_CALCULATION_DIFFERS",
      "RECOMMENDATION_OUTPUT_DIFFERS",
      "ESCALATION_ROUTING_DIFFERS",
      "EXPLAINABILITY_DIFFERS",
      "CONFIDENCE_VALUE_DIFFERS",
      "LINEAGE_GRAPH_DIFFERS",
      "REPLAY_HASH_MISMATCH",
      "INTEGRITY_VERIFICATION_FAILURE",
      "VERSION_MISMATCH",
      "TENANT_MISMATCH",
      "CONSTITUTIONAL_MISMATCH",
      "AUTHORITY_MISMATCH",
      "OUTPUT_INCOMPLETE",
    ];
    for (const scenario of scenarios) {
      const report = verifyGovernanceOutputs({ scenario });
      const validation = validateGovernanceOutputVerificationReport(report);
      expect(report.verification_state, scenario).not.toBe("VERIFIED");
      expect(report.certification_recommendation, scenario).toBe("BLOCK_CERTIFICATION");
      expect(validation.validation_state, scenario).toBe("INVALID");
      expect(validation.replay_outputs_verified, scenario).toBe(false);
    }
  }, 320000);

  it("exposes operator observability for verified outputs", () => {
    const surface = buildGovernanceOutputObservabilitySurface();
    expect(surface.replay_outputs_verified).toBe(true);
    expect(surface.comparison_count).toBe(10);
    expect(surface.mismatched_comparisons).toBe(0);
    expect(surface.advisory_only_notice).toContain("immutable originals");
  });
});
