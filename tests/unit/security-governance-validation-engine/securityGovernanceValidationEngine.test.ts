import { describe, expect, it, vi } from "vitest";
import {
  buildSecurityGovernanceObservabilitySurface,
  computeSecurityGovernanceValidationReportHash,
  getSecurityGovernanceValidationContract,
  runSecurityGovernanceValidation,
  validateSecurityGovernanceValidationReport,
} from "@/services/security-governance-validation-engine";
import type { SecurityGovernanceScenario, SecurityGovernanceViolation } from "@/types/security-governance-validation-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 8K.3 Security Governance Validation Engine", () => {
  it("defines security governance doctrine, states, and validation scope", () => {
    const contract = getSecurityGovernanceValidationContract();

    expect(contract.doctrine.engine_version).toBe("security-governance-validation-engine/v8K.3");
    expect(contract.doctrine.principles).toContain("governance-supremacy");
    expect(contract.doctrine.principles).toContain("zero-trust");
    expect(contract.doctrine.principles).toContain("fail-closed");
    expect(contract.doctrine.validation_states).toContain("FAIL_CLOSED_VALIDATION");
    expect(contract.doctrine.validation_scope).toEqual(["GOVERNANCE", "CONSTITUTIONAL", "AUTHORITY", "POLICY", "SECURITY", "BOUNDARY", "TENANT", "VISIBILITY", "FAIL_CLOSED"]);
  });

  it("passes secure, governed, tenant-isolated controlled autonomy validation", () => {
    const report = runSecurityGovernanceValidation();
    const validation = validateSecurityGovernanceValidationReport(report);

    expect(report.engine_version).toBe("security-governance-validation-engine/v8K.3");
    expect(report.validation_state).toBe("COMPLETE");
    expect(report.overall_security_score).toBe(1);
    expect(report.detected_violations).toEqual([]);
    expect(report.operator_required).toBe(false);
    expect(report.governance_validation.status).toBe("PASS");
    expect(report.constitutional_validation.status).toBe("PASS");
    expect(report.authority_validation.status).toBe("PASS");
    expect(report.policy_validation.status).toBe("PASS");
    expect(report.security_validation.status).toBe("PASS");
    expect(report.boundary_validation.status).toBe("PASS");
    expect(report.tenant_validation.status).toBe("PASS");
    expect(report.visibility_validation.status).toBe("PASS");
    expect(report.fail_closed_validation.status).toBe("PASS");
    expect(report.deterministic_validation.deterministic_result).toBe("DETERMINISTIC");
    expect(validation.valid).toBe(true);
  });

  it("preserves immutable security evidence across governance, policy, authority, replay, lineage, and integrity references", () => {
    const report = runSecurityGovernanceValidation();

    expect(report.evidence.length).toBe(9);
    expect(report.evidence.every((item) => item.tenant_id === report.tenant_id)).toBe(true);
    expect(report.evidence.every((item) => item.governance_reference && item.constitutional_reference && item.authority_reference && item.policy_reference)).toBe(true);
    expect(report.evidence.every((item) => item.replay_reference && item.lineage_reference && item.integrity_hash && item.immutable_reference)).toBe(true);
    expect(report.replay_reference).toBeTruthy();
    expect(report.lineage_reference).toBeTruthy();
    expect(report.integrity_hash).toBeTruthy();
  });

  it.each([
    ["GOVERNANCE_VALIDATION_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_VALIDATION_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["AUTHORITY_VALIDATION_FAILURE", "AUTHORITY_VALIDATION_FAILED"],
    ["POLICY_VALIDATION_FAILURE", "POLICY_VALIDATION_FAILED"],
    ["SECURITY_BOUNDARY_VIOLATION", "SECURITY_BOUNDARY_VIOLATION_DETECTED"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION_DETECTED"],
    ["UNAUTHORIZED_EXECUTION", "UNAUTHORIZED_EXECUTION_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_BYPASS_DETECTED"],
    ["HIDDEN_EXECUTION_DETECTED", "HIDDEN_EXECUTION_DETECTED"],
    ["HIDDEN_GOVERNANCE_STATE_DETECTED", "HIDDEN_GOVERNANCE_STATE_DETECTED"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE_DETECTED"],
    ["CROSS_TENANT_ACCESS_DETECTED", "CROSS_TENANT_ACCESS_DETECTED"],
    ["REPLAY_EVIDENCE_MODIFIED", "REPLAY_EVIDENCE_MODIFIED"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["FAIL_OPEN_BEHAVIOR_DETECTED", "FAIL_OPEN_BEHAVIOR_DETECTED"],
    ["INCOMPLETE_CERTIFICATION_EVIDENCE", "CERTIFICATION_EVIDENCE_INCOMPLETE"],
  ] as readonly [SecurityGovernanceScenario, SecurityGovernanceViolation][])(
    "fails closed for %s",
    (scenario, violation) => {
      const report = runSecurityGovernanceValidation({ scenario });
      const validation = validateSecurityGovernanceValidationReport(report);

      expect(report.overall_security_score).toBeLessThan(1);
      expect(report.detected_violations).toContain(violation);
      expect(report.operator_required).toBe(true);
      expect(report.detected_risks.some((risk) => risk.includes(violation))).toBe(true);
      expect(validation.valid).toBe(false);
      expect(validation.violations).toContain(violation);
    },
  );

  it("escalates critical security risks for privilege, unauthorized execution, tenant, and fail-open failures", () => {
    expect(runSecurityGovernanceValidation({ scenario: "PRIVILEGE_ESCALATION" }).detected_risks).toContain("CRITICAL:PRIVILEGE_ESCALATION_DETECTED");
    expect(runSecurityGovernanceValidation({ scenario: "UNAUTHORIZED_EXECUTION" }).detected_risks).toContain("CRITICAL:UNAUTHORIZED_EXECUTION_DETECTED");
    expect(runSecurityGovernanceValidation({ scenario: "CROSS_TENANT_ACCESS_DETECTED" }).detected_risks).toContain("CRITICAL:CROSS_TENANT_ACCESS_DETECTED");
    expect(runSecurityGovernanceValidation({ scenario: "FAIL_OPEN_BEHAVIOR_DETECTED" }).detected_risks).toContain("CRITICAL:FAIL_OPEN_BEHAVIOR_DETECTED");
  });

  it("repeats identical validations with identical report hashes", () => {
    const first = runSecurityGovernanceValidation();
    const second = runSecurityGovernanceValidation();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.evidence.map((item) => item.evidence_hash)).toEqual(first.evidence.map((item) => item.evidence_hash));
    expect(first.report_hash).toBe(computeSecurityGovernanceValidationReportHash(first));
  });

  it("exposes security governance observability", () => {
    const surface = buildSecurityGovernanceObservabilitySurface(runSecurityGovernanceValidation({ scenario: "GOVERNANCE_BYPASS" }));

    expect(surface.validation_state).toBe("COMPLETE");
    expect(surface.violations).toContain("GOVERNANCE_BYPASS_DETECTED");
    expect(surface.risks).toContain("HIGH:GOVERNANCE_BYPASS_DETECTED");
    expect(surface.operator_required).toBe(true);
    expect(surface.evidence_records).toBe(9);
    expect(surface.overall_security_score).toBeLessThan(1);
  });
});
