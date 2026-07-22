import { describe, expect, it } from "vitest";
import {
  computeSecurityBoundaryHash,
  getSecurityBoundaryCertificationFoundation,
  replaySecurityBoundaryCertification,
  runSecurityBoundaryCertification,
  SECURITY_BOUNDARY_CHECKS,
  SECURITY_BOUNDARY_SCOPES,
} from "@/services/decision-security-isolation-boundary-certification";
import type { SecurityBoundaryCertificationFailure, SecurityBoundaryCertificationInput } from "@/types/decision-security-isolation-boundary-certification";

describe("Mission Control Phase 9.12.10 Security, Isolation & Boundary Certification", () => {
  it("publishes the security boundary certification foundation", () => {
    const foundation = getSecurityBoundaryCertificationFoundation();

    expect(foundation.certification_version).toBe("decision-security-isolation-boundary-certification/v1");
    expect(foundation.scopes).toEqual(SECURITY_BOUNDARY_SCOPES);
    expect(foundation.checks).toEqual(SECURITY_BOUNDARY_CHECKS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("validates tenant isolation and cross-tenant protections", () => {
    const result = runSecurityBoundaryCertification();

    expect(computeSecurityBoundaryHash(result.tenant_isolation_report)).toBe(result.tenant_isolation_report.integrity_hash);
    expect(result.tenant_isolation_report.validation_state).toBe("PASS");
    expect(result.tenant_isolation_report.cross_tenant_requests_rejected).toBe(true);
    expect(result.validation.tenant_isolation_valid).toBe(true);
    expect(result.validation.cross_tenant_access_blocked).toBe(true);
  });

  it("validates authority, governance, and constitutional boundaries", () => {
    const result = runSecurityBoundaryCertification();

    expect(result.authority_boundary_report.validation_state).toBe("PASS");
    expect(result.governance_boundary_report.validation_state).toBe("PASS");
    expect(result.validation.authority_boundaries_enforced).toBe(true);
    expect(result.validation.governance_boundaries_enforced).toBe(true);
    expect(result.validation.constitutional_boundaries_enforced).toBe(true);
  });

  it("enforces advisory-only operation and unauthorized execution prevention", () => {
    const result = runSecurityBoundaryCertification();

    expect(result.advisory_execution_report.validation_state).toBe("PASS");
    expect(result.advisory_execution_report.command_execution_blocked).toBe(true);
    expect(result.validation.autonomous_execution_prevented).toBe(true);
    expect(result.validation.command_execution_blocked).toBe(true);
    expect(result.execution_authority_granted).toBe(false);
  });

  it("validates deterministic security replay and immutable evidence", () => {
    const result = runSecurityBoundaryCertification();

    expect(result.security_replay_report.validation_state).toBe("PASS");
    expect(result.evidence_package.complete).toBe(true);
    expect(result.evidence_package.immutable).toBe(true);
    expect(result.security_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.security_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("approves the security report for production readiness", () => {
    const result = runSecurityBoundaryCertification();

    expect(result.security_report.certification_decision).toBe("PASS");
    expect(result.security_report.production_readiness).toBe("READY");
    expect(result.security_report.tenant_isolation_assessment).toBe("PASS");
    expect(result.security_report.execution_prevention_assessment).toBe("PASS");
  });

  it("remains replayable and advisory-only", () => {
    const result = runSecurityBoundaryCertification();

    expect(replaySecurityBoundaryCertification(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_security_state).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it.each([
    ["OBSERVABILITY_INVALID", "OBSERVABILITY_CERTIFICATION_INVALID"],
    ["TENANT_LEAKAGE", "TENANT_LEAKAGE"],
    ["CROSS_TENANT_ACCESS", "CROSS_TENANT_ACCESS"],
    ["CROSS_TENANT_REPLAY", "CROSS_TENANT_REPLAY_CONTAMINATION"],
    ["CROSS_TENANT_LEDGER", "CROSS_TENANT_LEDGER_CONTAMINATION"],
    ["AUTHORITY_ESCALATION", "UNAUTHORIZED_AUTHORITY_ESCALATION"],
    ["ROLE_PRIVILEGE_ESCALATION", "ROLE_PRIVILEGE_ESCALATION"],
    ["MISSING_APPROVAL", "MISSING_APPROVAL_ENFORCEMENT"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["POLICY_PRECEDENCE_FAILURE", "POLICY_PRECEDENCE_FAILURE"],
    ["HIDDEN_EXECUTION_PATHWAY", "HIDDEN_EXECUTION_PATHWAY"],
    ["AUTONOMOUS_EXECUTION", "AUTONOMOUS_EXECUTION_CAPABILITY"],
    ["COMMAND_EXECUTED", "SUCCESSFUL_COMMAND_EXECUTION"],
    ["RUNTIME_PRIVILEGE_BYPASS", "RUNTIME_PRIVILEGE_BYPASS"],
    ["MISSING_AUDIT", "MISSING_AUDIT_RECORDS"],
    ["BOUNDARY_REPLAY_MISMATCH", "BOUNDARY_REPLAY_MISMATCH"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["HIDDEN_SECURITY_STATE", "HIDDEN_SECURITY_STATE"],
    ["FAIL_OPEN", "FAIL_OPEN_BOUNDARY_BEHAVIOR"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<SecurityBoundaryCertificationInput["scenario"]>, SecurityBoundaryCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runSecurityBoundaryCertification({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.security_report.production_readiness).toBe("BLOCKED");
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_security_state).toBe(false);
  });

  it("fails closed when the role lacks security visibility", () => {
    const result = runSecurityBoundaryCertification({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects security certification tampering", () => {
    const result = runSecurityBoundaryCertification();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replaySecurityBoundaryCertification(tampered)).toBe(false);
  });
});
