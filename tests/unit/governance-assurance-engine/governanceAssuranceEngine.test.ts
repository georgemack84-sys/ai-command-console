import { describe, expect, it } from "vitest";
import {
  buildGovernanceAssuranceDashboardSurface,
  buildGovernanceAssurancePackage,
  computeGovernanceAssuranceEvidenceHash,
  getGovernanceAssuranceFramework,
} from "@/services/governance-assurance-engine";
import { buildRuntimeAssurancePackage } from "@/services/runtime-assurance-engine";
import type { GovernanceAssuranceFailureReason, GovernanceAssuranceScenario } from "@/types/governance-assurance-engine";

describe("Mission Control Phase 8E.3 Governance Assurance Engine", () => {
  it("publishes deterministic governance doctrine, state machine, and health model", () => {
    const framework = getGovernanceAssuranceFramework();

    expect(framework.doctrine.engine_version).toBe("governance-assurance-engine/v8E.3");
    expect(framework.doctrine.principles).toContain("constitution-supremacy");
    expect(framework.doctrine.principles).toContain("advisory-only");
    expect(framework.doctrine.states).toContain("VERIFYING_CONSTITUTION");
    expect(framework.doctrine.states).toContain("APPROVAL_REQUIRED");
    expect(framework.doctrine.health_levels).toEqual(["TRUSTED", "COMPLIANT", "STABLE", "WATCH", "NON_COMPLIANT", "HIGH_RISK", "CRITICAL"]);
    expect(framework.package.validation.validation_state).toBe("PASS");
  });

  it("builds a baseline governance assurance package without granting approval or mutating governance", () => {
    const pkg = buildGovernanceAssurancePackage();

    expect(Object.isFrozen(pkg)).toBe(true);
    expect(pkg.engine_version).toBe("governance-assurance-engine/v8E.3");
    expect(pkg.pipeline_state).toBe("COMPLIANT");
    expect(pkg.governance_report.governance_health).toBe("TRUSTED");
    expect(pkg.governance_report.governance_recommendation).toBe("CONTINUE");
    expect(pkg.compliance_score.overall_score).toBe(100);
    expect(pkg.authority_validation.authority_verified).toBe(true);
    expect(pkg.validation.ready_for_recovery_intervention).toBe(true);
    expect(pkg.advisory_only).toBe(true);
    expect(pkg.workflow_executed).toBe(false);
    expect(pkg.approval_granted).toBe(false);
    expect(pkg.governance_modified).toBe(false);
    expect(pkg.constitution_modified).toBe(false);
    expect(pkg.authority_modified).toBe(false);
  });

  it("produces immutable governance evidence hashes and deterministic replay", () => {
    const first = buildGovernanceAssurancePackage();
    const second = buildGovernanceAssurancePackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(computeGovernanceAssuranceEvidenceHash(first.assurance_evidence)).toBe(first.assurance_evidence.integrity_hash);
    expect(first.replay.reconstructed_pipeline).toEqual(["CREATED", "INITIALIZING", "VERIFYING_CONSTITUTION", "VERIFYING_AUTHORITY", "VERIFYING_POLICIES", "VERIFYING_COMPLIANCE", "VERIFYING_APPROVALS", "ASSESSING_GOVERNANCE", "ACTIVE"]);
    expect(first.replay.reconstructed_health).toBe("TRUSTED");
    expect(first.replay.validation_state).toBe("PASS");
  });

  it.each([
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["HIDDEN_EXECUTION", "HIDDEN_EXECUTION"],
    ["UNAUTHORIZED_EXECUTION_PATH", "UNAUTHORIZED_EXECUTION_PATH"],
    ["CONSTITUTIONAL_DRIFT", "CONSTITUTIONAL_DRIFT"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION"],
    ["EXPIRED_AUTHORITY", "EXPIRED_AUTHORITY"],
    ["UNAUTHORIZED_DELEGATION", "UNAUTHORIZED_DELEGATION"],
    ["PRIVILEGE_ABUSE", "PRIVILEGE_ABUSE"],
    ["INVALID_EXECUTION_AUTHORITY", "INVALID_EXECUTION_AUTHORITY"],
    ["POLICY_VIOLATION", "POLICY_VIOLATION"],
    ["POLICY_CONFLICT", "POLICY_CONFLICT"],
    ["POLICY_BYPASS", "POLICY_BYPASS"],
    ["OUTDATED_POLICY_REFERENCE", "OUTDATED_POLICY_REFERENCE"],
    ["INCONSISTENT_POLICY_APPLICATION", "INCONSISTENT_POLICY_APPLICATION"],
    ["COMPLIANCE_FAILURE", "COMPLIANCE_FAILURE"],
    ["INCOMPLETE_EVIDENCE", "INCOMPLETE_EVIDENCE"],
    ["MISSING_AUDIT_RECORD", "MISSING_AUDIT_RECORD"],
    ["REPORTING_DEFICIENCY", "REPORTING_DEFICIENCY"],
    ["GOVERNANCE_INCONSISTENCY", "GOVERNANCE_INCONSISTENCY"],
    ["REVOKED_APPROVAL", "REVOKED_APPROVAL"],
    ["MISSING_APPROVAL", "MISSING_APPROVAL"],
    ["EXPIRED_APPROVAL", "EXPIRED_APPROVAL"],
    ["INVALID_APPROVAL_CHAIN", "INVALID_APPROVAL_CHAIN"],
    ["UNAUTHORIZED_APPROVAL", "UNAUTHORIZED_APPROVAL"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATION"],
    ["ASSURANCE_NOT_ADVISORY", "ASSURANCE_NOT_ADVISORY"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [GovernanceAssuranceScenario, GovernanceAssuranceFailureReason][])("fails closed for %s", (scenario, reason) => {
    const pkg = buildGovernanceAssurancePackage({ scenario });

    expect(pkg.validation.validation_state).toBe("FAIL");
    expect(pkg.validation.failures).toContain(reason);
    expect(pkg.governance_report.detected_violations).toContain(reason);
    expect(pkg.assurance_evidence.detected_violations).toContain(reason);
    expect(pkg.replay.validation_state).toBe("FAIL");
    expect(pkg.validation.ready_for_recovery_intervention).toBe(false);
  });

  it("requires approval when approvals are missing without granting approval autonomously", () => {
    const pkg = buildGovernanceAssurancePackage({ scenario: "MISSING_APPROVAL" });
    const dashboard = buildGovernanceAssuranceDashboardSurface(pkg);

    expect(pkg.governance_report.approval_status).toBe("REQUIRED");
    expect(pkg.governance_report.governance_recommendation).toBe("REQUEST_APPROVAL");
    expect(pkg.approval_granted).toBe(false);
    expect(dashboard.governance_state).toBe("APPROVAL_REQUIRED");
    expect(dashboard.operator_required).toBe(true);
  });

  it("inherits runtime assurance readiness failures from Phase 8E.2", () => {
    const runtimePackage = buildRuntimeAssurancePackage({ scenario: "POLICY_VIOLATION" });
    const pkg = buildGovernanceAssurancePackage({ runtimePackage });

    expect(pkg.validation.failures).toContain("RUNTIME_ASSURANCE_NOT_READY");
    expect(pkg.validation.failures).toContain("POLICY_VIOLATION");
    expect(pkg.validation.runtime_assurance_ready).toBe(false);
    expect(pkg.governance_report.governance_recommendation).toBe("RECOMMEND_ESCALATION");
  });

  it("detects tampered governance evidence and fails closed", () => {
    const pkg = buildGovernanceAssurancePackage({ scenario: "HASH_MISMATCH" });

    expect(pkg.validation.integrity_verified).toBe(false);
    expect(pkg.governance_report.governance_recommendation).toBe("FAIL_CLOSED");
    expect(pkg.advisory_only).toBe(true);
    expect(pkg.governance_modified).toBe(false);
  });
});
