import { describe, expect, it } from "vitest";
import {
  GOVERNANCE_CERTIFICATION_CHECKS,
  GOVERNANCE_CERTIFICATION_SCOPES,
  computeGovernancePolicyReportHash,
  getGovernanceConstitutionalCertificationFoundation,
  replayGovernanceConstitutionalCertification,
  runGovernanceConstitutionalCertification,
} from "@/services/decision-governance-constitutional-certification";
import type { GovernanceConstitutionalCertificationFailure, GovernanceConstitutionalCertificationInput } from "@/types/decision-governance-constitutional-certification";

describe("Mission Control Phase 9.12.5 Governance & Constitutional Certification", () => {
  it("publishes the governance constitutional certification foundation", () => {
    const foundation = getGovernanceConstitutionalCertificationFoundation();

    expect(foundation.certification_version).toBe("decision-governance-constitutional-certification/v1");
    expect(foundation.scopes).toEqual(GOVERNANCE_CERTIFICATION_SCOPES);
    expect(foundation.checks).toEqual(GOVERNANCE_CERTIFICATION_CHECKS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("validates continuous governance policy enforcement", () => {
    const result = runGovernanceConstitutionalCertification();

    expect(computeGovernancePolicyReportHash(result.policy_report)).toBe(result.policy_report.integrity_hash);
    expect(result.policy_report.validation_state).toBe("PASS");
    expect(result.policy_report.policy_precedence[0]).toBe("constitutional_policy");
    expect(result.policy_report.mandatory_policies_enforced).toBe(true);
    expect(result.policy_report.governance_decisions_logged).toBe(true);
  });

  it("validates constitutional compliance and authority boundaries", () => {
    const result = runGovernanceConstitutionalCertification();

    expect(result.constitutional_report.validation_state).toBe("PASS");
    expect(result.constitutional_report.violations_permitted).toBe(false);
    expect(result.authority_report.validation_state).toBe("PASS");
    expect(result.authority_report.execution_authority_granted).toBe(false);
    expect(result.authority_report.restricted_actions_blocked).toBe(true);
  });

  it("validates tenant isolation, advisory-only operation, and fail-closed controls", () => {
    const result = runGovernanceConstitutionalCertification();

    expect(result.tenant_report.validation_state).toBe("PASS");
    expect(result.tenant_report.cross_tenant_access_blocked).toBe(true);
    expect(result.advisory_fail_closed_report.recommendation_only_outputs).toBe(true);
    expect(result.advisory_fail_closed_report.no_autonomous_execution).toBe(true);
    expect(result.advisory_fail_closed_report.missing_evidence_blocks_progression).toBe(true);
  });

  it("collects immutable evidence and writes governance certification ledger entries", () => {
    const result = runGovernanceConstitutionalCertification();

    expect(result.evidence_package.complete).toBe(true);
    expect(result.evidence_package.immutable).toBe(true);
    expect(result.evidence_package.governance_evidence_refs.length).toBeGreaterThan(0);
    expect(result.governance_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4]);
    expect(result.governance_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("approves the governance certification report for production readiness", () => {
    const result = runGovernanceConstitutionalCertification();

    expect(result.governance_report.certification_decision).toBe("PASS");
    expect(result.governance_report.production_readiness).toBe("READY");
    expect(result.validation.governance_continuous).toBe(true);
    expect(result.validation.constitutional_compliant).toBe(true);
    expect(result.validation.execution_authority_absent).toBe(true);
  });

  it("remains replayable and advisory-only", () => {
    const result = runGovernanceConstitutionalCertification();

    expect(replayGovernanceConstitutionalCertification(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_governance_state).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it.each([
    ["REPLAY_INVALID", "REPLAY_RECONSTRUCTION_CERTIFICATION_INVALID"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_PERMITTED"],
    ["AUTHORITY_ESCALATION", "UNAUTHORIZED_AUTHORITY_ESCALATION"],
    ["MISSING_APPROVAL", "MISSING_REQUIRED_APPROVAL"],
    ["POLICY_PRECEDENCE_FAILURE", "POLICY_PRECEDENCE_FAILURE"],
    ["TENANT_BREACH", "TENANT_ISOLATION_BREACH"],
    ["CROSS_TENANT_EXPOSURE", "CROSS_TENANT_DATA_EXPOSURE"],
    ["REPLAY_GOVERNANCE_MISMATCH", "REPLAY_GOVERNANCE_MISMATCH"],
    ["MISSING_GOVERNANCE_EVIDENCE", "MISSING_GOVERNANCE_EVIDENCE"],
    ["MISSING_CONSTITUTIONAL_EVIDENCE", "MISSING_CONSTITUTIONAL_EVIDENCE"],
    ["MISSING_AUTHORITY_VALIDATION", "MISSING_AUTHORITY_VALIDATION"],
    ["ADVISORY_BOUNDARY_VIOLATION", "ADVISORY_ONLY_BOUNDARY_VIOLATION"],
    ["AUTONOMOUS_EXECUTION", "AUTONOMOUS_EXECUTION_CAPABILITY"],
    ["HIDDEN_EXECUTION_PATHWAY", "HIDDEN_EXECUTION_PATHWAY"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["LINEAGE_CORRUPTION", "GOVERNANCE_LINEAGE_CORRUPTION"],
    ["UNDETECTED_POLICY_CONFLICT", "UNDETECTED_POLICY_CONFLICT"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<GovernanceConstitutionalCertificationInput["scenario"]>, GovernanceConstitutionalCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runGovernanceConstitutionalCertification({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.governance_report.production_readiness).toBe("BLOCKED");
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_governance_state).toBe(false);
  });

  it("fails closed when the role lacks governance visibility", () => {
    const result = runGovernanceConstitutionalCertification({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects governance certification tampering", () => {
    const result = runGovernanceConstitutionalCertification();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayGovernanceConstitutionalCertification(tampered)).toBe(false);
  });
});
