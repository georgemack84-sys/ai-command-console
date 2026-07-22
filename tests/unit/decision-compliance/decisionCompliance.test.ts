import { describe, expect, it } from "vitest";
import { createAuthorityBoundaryRecord } from "@/services/decision-authority-boundary";
import {
  buildComplianceObservability,
  createComplianceEvaluation,
  getDecisionComplianceFramework,
  replayComplianceEvaluation,
  resolveApplicablePolicies,
  resolveConstitutionalRules,
  validateComplianceEvaluation,
  validateConstitutionalCompliance,
  validateGovernanceCompliance,
  verifyDecisionAuthority,
} from "@/services/decision-compliance";
import type { ComplianceFailure, DecisionComplianceInput } from "@/types/decision-compliance";

describe("Mission Control Phase 9.1.6 Governance & Constitutional Requirements", () => {
  it("publishes the mandatory compliance framework with valid baseline evaluation", () => {
    const framework = getDecisionComplianceFramework();

    expect(framework.hierarchy[0]).toBe("CONSTITUTION");
    expect(framework.evaluation.compliance_state).toBe("COMPLIANT");
    expect(framework.validation.validation_status).toBe("VALID");
    expect(framework.governance_validation.validation_status).toBe("VALID");
    expect(framework.constitutional_validation.validation_status).toBe("VALID");
    expect(framework.replay.replay_valid).toBe(true);
  });

  it("creates governance and constitutional reference contracts with replay, lineage, evidence, and hashes", () => {
    const evaluation = createComplianceEvaluation();
    const governance = evaluation.governance_references[0]!;
    const constitutional = evaluation.constitutional_references[0]!;

    expect(governance.policy_version).toBe("policy/v1");
    expect(governance.evidence_refs.length).toBeGreaterThan(0);
    expect(governance.replay_refs.length).toBeGreaterThan(0);
    expect(governance.lineage_refs.length).toBeGreaterThan(0);
    expect(governance.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(constitutional.constitutional_version).toBe("constitution/v1");
    expect(constitutional.authority_constraints).toContain("advisory-only");
  });

  it("maps decisions deterministically to governing policies and constitutional rules", () => {
    const authority = createAuthorityBoundaryRecord();
    const policies = resolveApplicablePolicies(authority);
    const rules = resolveConstitutionalRules(authority);

    expect(policies.length).toBeGreaterThanOrEqual(1);
    expect(policies[0]?.policy_version).toBe("policy/v1");
    expect(resolveApplicablePolicies(authority)).toEqual(policies);
    expect(rules.map((rule) => rule.constitutional_rule_id)).toEqual(["constitution_operator_supremacy", "constitution_advisory_only", "constitution_governance_supremacy"]);
  });

  it("verifies authority against compliance requirements", () => {
    const validAuthority = createAuthorityBoundaryRecord();
    const invalidAuthority = createAuthorityBoundaryRecord({ scenario: "EXECUTION_REQUEST" });

    expect(verifyDecisionAuthority(validAuthority)).toBe("COMPLIANT");
    expect(verifyDecisionAuthority(invalidAuthority)).toBe("AUTHORITY_VIOLATION");
    expect(validateComplianceEvaluation(createComplianceEvaluation({ authority_record: invalidAuthority })).failures).toContain("AUTHORITY_VALIDATION_FAILED");
  });

  it("records immutable compliance metadata and audit records", () => {
    const evaluation = createComplianceEvaluation();

    expect(evaluation.metadata.compliance_id).toBe(evaluation.compliance_id);
    expect(evaluation.metadata.evaluated_policies.length).toBeGreaterThan(0);
    expect(evaluation.metadata.evaluated_constitutional_rules.length).toBeGreaterThan(0);
    expect(evaluation.audit_record.append_only).toBe(true);
    expect(evaluation.audit_record.advisory_only).toBe(true);
    expect(evaluation.audit_record.authority_id).toBe(evaluation.authority_record.authority_id);
  });

  it.each([
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCE_MISSING"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_REFERENCE_MISSING"],
    ["UNSUPPORTED_POLICY", "POLICY_VERSION_UNSUPPORTED"],
    ["UNSUPPORTED_CONSTITUTION", "CONSTITUTIONAL_VERSION_UNSUPPORTED"],
    ["AUTHORITY_VIOLATION", "AUTHORITY_VALIDATION_FAILED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_BYPASS"],
    ["REPLAY_MISSING", "REPLAY_REFERENCE_MISSING"],
    ["LINEAGE_BROKEN", "LINEAGE_BROKEN"],
    ["TENANT_LEAK", "TENANT_BOUNDARY_VIOLATION"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_MISMATCH"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_EVALUATION"],
  ] satisfies [DecisionComplianceInput["scenario"], ComplianceFailure][])("fails closed for %s", (scenario, failure) => {
    const evaluation = createComplianceEvaluation({ scenario });
    const validation = validateComplianceEvaluation(evaluation);

    expect(validation.validation_status).toBe("FAILED_CLOSED");
    expect(validation.failures).toContain(failure);
  });

  it("reports governance-focused and constitutional-focused validation failures", () => {
    const governanceFailure = validateGovernanceCompliance(createComplianceEvaluation({ scenario: "MISSING_GOVERNANCE" }));
    const constitutionalFailure = validateConstitutionalCompliance(createComplianceEvaluation({ scenario: "MISSING_CONSTITUTIONAL" }));

    expect(governanceFailure.checks.governance_references_present).toBe(false);
    expect(constitutionalFailure.checks.constitutional_references_present).toBe(false);
  });

  it("replays compliance evaluations deterministically and detects tampering", () => {
    const evaluation = createComplianceEvaluation();
    const replay = replayComplianceEvaluation(evaluation);
    const tampered = { ...evaluation, integrity_hash: "tampered" };

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_state).toBe("COMPLIANT");
    expect(replay.reconstructed_policy_mappings).toEqual(evaluation.policy_mappings.map((mapping) => mapping.mapping_id).sort());
    expect(replayComplianceEvaluation(tampered).failures).toContain("INTEGRITY_MISMATCH");
  });

  it("builds compliance observability metrics", () => {
    const valid = createComplianceEvaluation();
    const governanceFailure = createComplianceEvaluation({ scenario: "MISSING_GOVERNANCE" });
    const constitutionalFailure = createComplianceEvaluation({ scenario: "MISSING_CONSTITUTIONAL" });
    const metrics = buildComplianceObservability([valid, governanceFailure, constitutionalFailure]);

    expect(metrics.governance_validation_count).toBe(3);
    expect(metrics.constitutional_validation_count).toBe(3);
    expect(metrics.compliance_outcomes.COMPLIANT).toBe(1);
    expect(metrics.governance_violations).toBeGreaterThan(0);
    expect(metrics.constitutional_violations).toBeGreaterThan(0);
    expect(metrics.policy_version_usage["policy/v1"]).toBeGreaterThan(0);
  });
});
