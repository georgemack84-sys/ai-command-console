import { describe, expect, it } from "vitest";

import {
  certifyGovernanceConstitutional,
  getGovernanceConstitutionalContract,
  replayGovernanceConstitutionalCertification,
  validateGovernanceConstitutionalCertification,
} from "../../../services/governance-constitutional-certification";
import type {
  GovernanceConstitutionalFailure,
  GovernanceConstitutionalScenario,
} from "../../../types/governance-constitutional-certification";

const failureScenarios: ReadonlyArray<readonly [GovernanceConstitutionalScenario, GovernanceConstitutionalFailure]> = [
  ["GOVERNANCE_VALIDATION_OMITTED", "GOVERNANCE_VALIDATION_OMITTED"],
  ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
  ["POLICY_NONDETERMINISM", "POLICY_EVALUATION_NONDETERMINISTIC"],
  ["GOVERNANCE_REPLAY_INCONSISTENT", "GOVERNANCE_REPLAY_INCONSISTENT"],
  ["CONSTITUTIONAL_VALIDATION_OMITTED", "CONSTITUTIONAL_VALIDATION_OMITTED"],
  ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_BYPASS_DETECTED"],
  ["CONSTITUTIONAL_REPLAY_INCONSISTENT", "CONSTITUTIONAL_REPLAY_INCONSISTENT"],
  ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
  ["UNAUTHORIZED_EXECUTION_AUTHORITY", "UNAUTHORIZED_EXECUTION_AUTHORITY"],
  ["ADVISORY_BOUNDARY_BROKEN", "ADVISORY_ONLY_BOUNDARY_BROKEN"],
  ["SELF_CERTIFICATION", "SELF_CERTIFICATION_PERMITTED"],
  ["GOVERNANCE_MODIFICATION", "GOVERNANCE_MODIFICATION_PERMITTED"],
  ["CONSTITUTIONAL_MODIFICATION", "CONSTITUTIONAL_MODIFICATION_PERMITTED"],
  ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_BREACH"],
  ["CROSS_TENANT_EVIDENCE", "CROSS_TENANT_EVIDENCE_ACCESS"],
  ["CROSS_TENANT_MEMORY", "CROSS_TENANT_ADAPTIVE_MEMORY_ACCESS"],
  ["CROSS_TENANT_REPLAY", "CROSS_TENANT_REPLAY_ACCESS"],
  ["MISSING_OPERATOR_APPROVAL", "OPERATOR_APPROVAL_MISSING"],
  ["APPROVAL_WORKFLOW_BYPASS", "APPROVAL_WORKFLOW_BYPASSED"],
  ["TRUTH_LEDGER_MUTATION", "TRUTH_LEDGER_MUTATION_PERMITTED"],
  ["AUDIT_LINEAGE_INCOMPLETE", "AUDIT_LINEAGE_INCOMPLETE"],
  ["CONSTITUTIONAL_LINEAGE_INCOMPLETE", "CONSTITUTIONAL_LINEAGE_INCOMPLETE"],
  ["INTEGRITY_FAILURE", "INTEGRITY_HASH_MISMATCH"],
  ["FAIL_OPEN_BEHAVIOR", "FAIL_CLOSED_BEHAVIOR_ABSENT"],
];

describe("governance constitutional certification", () => {
  it("publishes the governance and constitutional doctrine", () => {
    const contract = getGovernanceConstitutionalContract();

    expect(contract.doctrine.version).toBe("governance-constitutional-certification/v10.15.4");
    expect(contract.doctrine.governance_supremacy_required).toBe(true);
    expect(contract.doctrine.constitutional_supremacy_required).toBe(true);
    expect(contract.doctrine.tenant_isolation_required).toBe(true);
    expect(contract.doctrine.operator_supremacy_required).toBe(true);
    expect(contract.doctrine.fail_closed_required).toBe(true);
    expect(contract.doctrine.permitted_authority).toEqual(expect.arrayContaining(["OBSERVE", "RECOMMEND", "SIMULATE", "ADVISE"]));
    expect(contract.doctrine.prohibited_authority).toEqual(expect.arrayContaining(["EXECUTE_PRODUCTION_ACTION", "MODIFY_GOVERNANCE", "MODIFY_CONSTITUTION", "SELF_CERTIFY", "MUTATE_TRUTH_LEDGER"]));
    expect(contract.validation.valid).toBe(true);
  });

  it("certifies governance, constitutional, tenant, approval, and advisory boundaries", () => {
    const first = certifyGovernanceConstitutional();
    const second = certifyGovernanceConstitutional();

    expect(first.status).toBe("PASS");
    expect(first.record.certification_status).toBe("CERTIFIED");
    expect(first.governed).toBe(true);
    expect(first.constitutional).toBe(true);
    expect(first.advisory_only).toBe(true);
    expect(first.tenant_safe).toBe(true);
    expect(first.approval_enforced).toBe(true);
    expect(first.production_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateGovernanceConstitutionalCertification(first).valid).toBe(true);
    expect(replayGovernanceConstitutionalCertification(first)).toBe(true);
  });

  it("validates every control domain", () => {
    const result = certifyGovernanceConstitutional();

    expect(result.governance_supremacy.governance_validation_mandatory).toBe(true);
    expect(result.governance_supremacy.policy_evaluation_deterministic).toBe(true);
    expect(result.constitutional_enforcement.constitutional_doctrine_enforced).toBe(true);
    expect(result.constitutional_enforcement.violations_fail_closed).toBe(true);
    expect(result.authority_restriction.autonomous_execution_blocked).toBe(true);
    expect(result.authority_restriction.self_certification_prohibited).toBe(true);
    expect(result.authority_restriction.truth_ledger_mutation_prohibited).toBe(true);
    expect(result.tenant_isolation.evidence_isolated).toBe(true);
    expect(result.tenant_isolation.adaptive_memory_isolated).toBe(true);
    expect(result.tenant_isolation.replay_artifacts_isolated).toBe(true);
    expect(result.approval_enforcement.approval_workflows_mandatory).toBe(true);
    expect(result.bypass_escalation_detection.authority_escalation_absent).toBe(true);
  });

  it("emits complete governance certification and authority compliance reports", () => {
    const result = certifyGovernanceConstitutional();

    expect(result.certification_report.production_readiness_recommendation).toBe("READY");
    expect(result.certification_report.governance_supremacy_assessment).toBe("PASS");
    expect(result.certification_report.constitutional_enforcement_assessment).toBe("PASS");
    expect(result.authority_compliance_report.authority_boundary_verified).toBe(true);
    expect(result.authority_compliance_report.governance_policy_compliance).toBe(true);
    expect(result.authority_compliance_report.constitutional_doctrine_compliance).toBe(true);
    expect(result.authority_compliance_report.operator_authority_preserved).toBe(true);
    expect(result.authority_compliance_report.replay_audit_lineage_complete).toBe(true);
    expect(result.validation_tests).toHaveLength(26);
  });

  it.each(failureScenarios)("fails certification for %s", (scenario, failure) => {
    const result = certifyGovernanceConstitutional({ scenario });
    const validation = validateGovernanceConstitutionalCertification(result);

    expect(result.status).toBe("FAIL");
    expect(result.record.certification_status).toBe("REJECTED");
    expect(result.production_ready).toBe(false);
    expect(result.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replayGovernanceConstitutionalCertification(result)).toBe(false);
  });

  it("detects tampering through integrity checks", () => {
    const result = certifyGovernanceConstitutional();
    const tampered = {
      ...result,
      record: {
        ...result.record,
        governance_supremacy_status: "FAIL" as const,
      },
    };

    expect(validateGovernanceConstitutionalCertification(tampered).integrity_hash_valid).toBe(false);
    expect(replayGovernanceConstitutionalCertification(tampered)).toBe(false);
  });
});
