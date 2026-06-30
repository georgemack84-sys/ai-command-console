import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceAuthorityBoundaryObservabilitySurface,
  getGovernanceAuthorityBoundaryValidationContract,
  runGovernanceAuthorityBoundaryValidation,
} from "@/services/governance-authority-boundary-validation";
import type { GovernanceAuthorityBoundaryScenario, GovernanceAuthorityDomain, GovernanceAuthorityValidationState, GovernanceAuthorityViolation } from "@/types/governance-authority-boundary-validation";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7L.4 Authority Boundary Validation", () => {
  it("defines authority boundary validation doctrine", () => {
    const contract = getGovernanceAuthorityBoundaryValidationContract();

    expect(contract.doctrine.schema_version).toBe("governance-authority-boundary-validation/v7L.4");
    expect(contract.doctrine.principles).toContain("advisory-only");
    expect(contract.doctrine.principles).toContain("zero-execution-authority");
    expect(contract.doctrine.principles).toContain("operator-supremacy");
    expect(contract.doctrine.failure_states).toContain("AUTHORITY_ESCALATION_DETECTED");
    expect(contract.doctrine.domains).toContain("EXECUTION_AUTHORITY");
  });

  it("validates baseline governance intelligence as advisory-only and authority bounded", () => {
    const report = runGovernanceAuthorityBoundaryValidation();

    expect(report.phase_version).toBe("7L.4");
    expect(report.validation_run.overall_result).toBe("PASS");
    expect(report.validation_result.overall_result).toBe("PASS");
    expect(report.validation_result.failure_count).toBe(0);
    expect(report.authority_checks.every((check) => check.validation_result === "PASS")).toBe(true);
    expect(report.timeline.at(-1)?.state).toBe("VALIDATED");
  });

  it("validates every authority domain", () => {
    const report = runGovernanceAuthorityBoundaryValidation();

    expect(report.authority_checks.map((check) => check.component)).toEqual(["ADVISORY_ONLY", "EXECUTION_AUTHORITY", "CONSTITUTION", "POLICY_ENFORCEMENT", "OPERATOR_SUPREMACY", "AUTHORITY_ESCALATION", "GOVERNANCE_BYPASS"]);
    expect(report.validation_result.advisory_result).toBe("PASS");
    expect(report.validation_result.execution_result).toBe("PASS");
    expect(report.validation_result.constitution_result).toBe("PASS");
    expect(report.validation_result.policy_result).toBe("PASS");
    expect(report.validation_result.operator_result).toBe("PASS");
  });

  it("is deterministic across repeated authority validations", () => {
    const first = runGovernanceAuthorityBoundaryValidation();
    const second = runGovernanceAuthorityBoundaryValidation();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.validation_result.result_hash).toBe(first.validation_result.result_hash);
    expect(second.authority_checks.map((check) => check.check_hash)).toEqual(first.authority_checks.map((check) => check.check_hash));
  });

  it("stores authority evidence in an append-only truth ledger record", () => {
    const report = runGovernanceAuthorityBoundaryValidation();

    expect(report.evidence_package.constitution_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.policy_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.operator_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.certification_refs.length).toBeGreaterThan(0);
    expect(report.truth_ledger_record.append_only).toBe(true);
    expect(report.truth_ledger_record.check_hashes).toEqual(report.authority_checks.map((check) => check.check_hash));
  });

  it.each([
    ["EXECUTION_COMMAND_GENERATED", "ADVISORY_ONLY", "EXECUTION_COMMAND_GENERATED", "ADVISORY_FAILURE"],
    ["STATE_MODIFICATION_REQUESTED", "ADVISORY_ONLY", "STATE_MODIFICATION_REQUESTED", "ADVISORY_FAILURE"],
    ["AUTONOMOUS_ACTION_INITIATED", "ADVISORY_ONLY", "AUTONOMOUS_ACTION_INITIATED", "ADVISORY_FAILURE"],
    ["EXECUTION_CAPABILITY_DETECTED", "EXECUTION_AUTHORITY", "EXECUTION_CAPABILITY_DETECTED", "EXECUTION_AUTHORITY_FAILURE"],
    ["PRIVILEGED_OPERATION_ATTEMPTED", "EXECUTION_AUTHORITY", "PRIVILEGED_OPERATION_ATTEMPTED", "EXECUTION_AUTHORITY_FAILURE"],
    ["COMMAND_TRANSMISSION_INITIATED", "EXECUTION_AUTHORITY", "COMMAND_TRANSMISSION_INITIATED", "EXECUTION_AUTHORITY_FAILURE"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTION", "CONSTITUTIONAL_VIOLATION", "CONSTITUTION_FAILURE"],
    ["PROHIBITED_AUTHORITY_EXERCISED", "CONSTITUTION", "PROHIBITED_AUTHORITY_EXERCISED", "CONSTITUTION_FAILURE"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTION", "CONSTITUTIONAL_BYPASS", "CONSTITUTION_FAILURE"],
    ["POLICY_IGNORED", "POLICY_ENFORCEMENT", "POLICY_IGNORED", "POLICY_FAILURE"],
    ["ENFORCEMENT_BYPASSED", "POLICY_ENFORCEMENT", "ENFORCEMENT_BYPASSED", "POLICY_FAILURE"],
    ["INCONSISTENT_ENFORCEMENT", "POLICY_ENFORCEMENT", "INCONSISTENT_ENFORCEMENT", "POLICY_FAILURE"],
    ["OPERATOR_OVERRIDE_BLOCKED", "OPERATOR_SUPREMACY", "OPERATOR_OVERRIDE_BLOCKED", "OPERATOR_FAILURE"],
    ["GOVERNANCE_SELF_APPROVAL", "OPERATOR_SUPREMACY", "GOVERNANCE_SELF_APPROVAL", "OPERATOR_FAILURE"],
    ["OPERATOR_AUTHORITY_DIMINISHED", "OPERATOR_SUPREMACY", "OPERATOR_AUTHORITY_DIMINISHED", "OPERATOR_FAILURE"],
    ["PRIVILEGE_EXPANSION", "AUTHORITY_ESCALATION", "PRIVILEGE_EXPANSION", "AUTHORITY_ESCALATION_DETECTED"],
    ["ROLE_ELEVATION", "AUTHORITY_ESCALATION", "ROLE_ELEVATION", "AUTHORITY_ESCALATION_DETECTED"],
    ["UNAUTHORIZED_AUTHORITY_ACQUISITION", "AUTHORITY_ESCALATION", "UNAUTHORIZED_AUTHORITY_ACQUISITION", "AUTHORITY_ESCALATION_DETECTED"],
    ["APPROVAL_WORKFLOW_BYPASSED", "GOVERNANCE_BYPASS", "APPROVAL_WORKFLOW_BYPASSED", "GOVERNANCE_BYPASS_DETECTED"],
    ["OPERATOR_REVIEW_BYPASSED", "GOVERNANCE_BYPASS", "OPERATOR_REVIEW_BYPASSED", "GOVERNANCE_BYPASS_DETECTED"],
    ["TENANT_AUTHORITY_LEAK", "GOVERNANCE_BYPASS", "TENANT_AUTHORITY_LEAK", "GOVERNANCE_BYPASS_DETECTED"],
  ] as readonly [GovernanceAuthorityBoundaryScenario, GovernanceAuthorityDomain, GovernanceAuthorityViolation, GovernanceAuthorityValidationState][])("rejects %s", (scenario, domain, violation, finalState) => {
    const report = runGovernanceAuthorityBoundaryValidation({ scenario });
    const failed = report.authority_checks.find((check) => check.component === domain);

    expect(report.validation_run.overall_result).toBe("FAIL");
    expect(report.validation_result.failure_count).toBeGreaterThan(0);
    expect(report.rejected_violations).toContain(violation);
    expect(report.timeline.at(-1)?.state).toBe(finalState);
    expect(failed?.validation_result).toBe("FAIL");
    expect(failed?.violation_type).toBe(violation);
  });

  it("keeps authority validation read-only, advisory-only, and unable to grant privileges", () => {
    const report = runGovernanceAuthorityBoundaryValidation();

    expect(report.read_only).toBe(true);
    expect(report.advisory_only).toBe(true);
    expect(report.execution_authority_granted).toBe(false);
    expect(report.privilege_elevation_allowed).toBe(false);
    expect(report.governance_self_approval_allowed).toBe(false);
    expect(report.policy_mutation_allowed).toBe(false);
    expect(report.constitution_mutation_allowed).toBe(false);
    expect(report.operator_supremacy_preserved).toBe(true);
    expect(report.tenant_isolated).toBe(true);
    expect(report.authority_protected).toBe(true);
  });

  it("exposes authority observability for bypass detections", () => {
    const surface = buildGovernanceAuthorityBoundaryObservabilitySurface({ scenario: "APPROVAL_WORKFLOW_BYPASSED" });

    expect(surface.overall_result).toBe("FAIL");
    expect(surface.validation_state).toBe("GOVERNANCE_BYPASS_DETECTED");
    expect(surface.check_count).toBeGreaterThan(0);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.rejected_violations).toContain("APPROVAL_WORKFLOW_BYPASSED");
    expect(surface.authority_violation_count).toBeGreaterThan(0);
    expect(surface.certification_success_rate).toBe(0);
    expect(surface.report_hash).toBeTruthy();
  });
});
