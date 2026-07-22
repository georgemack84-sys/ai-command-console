import { describe, expect, it } from "vitest";
import { getTrustComplianceVerificationBundle, replayTrustComplianceVerification, runTrustComplianceVerification, validateTrustComplianceVerification } from "@/services/trust-compliance-verification";
import type { TrustComplianceScenario } from "@/types/trust-compliance-verification";

describe("Program 5 P5.9 Constitutional & Policy Compliance", () => {
  it("publishes compliance doctrine without creating policy, enforcing policy, or making authority decisions", () => {
    const bundle = getTrustComplianceVerificationBundle();

    expect(bundle.doctrine.version).toBe("trust-compliance-verification/v5.9");
    expect(bundle.doctrine.owns_constitutional_compliance).toBe(true);
    expect(bundle.doctrine.owns_policy_compliance).toBe(true);
    expect(bundle.doctrine.owns_authority_compliance).toBe(true);
    expect(bundle.doctrine.owns_compliance_evidence).toBe(true);
    expect(bundle.doctrine.owns_compliance_reporting).toBe(true);
    expect(bundle.doctrine.creates_constitutional_policy).toBe(false);
    expect(bundle.doctrine.executes_governance_actions).toBe(false);
    expect(bundle.doctrine.makes_authority_decisions).toBe(false);
    expect(bundle.doctrine.executes_policy_enforcement).toBe(false);
    expect(bundle.doctrine.makes_qualification_decisions).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("validates deterministic constitutional, policy, and authority compliance", () => {
    const first = runTrustComplianceVerification();
    const second = runTrustComplianceVerification();

    expect(first.phase_identifier).toBe("TrustComplianceVerification");
    expect(first.rules.categories).toEqual(["CONSTITUTIONAL", "POLICY", "AUTHORITY", "GOVERNANCE", "TRUST", "ALIGNMENT"]);
    expect(first.constitutional.status).toBe("COMPLIANT");
    expect(first.policy.status).toBe("COMPLIANT");
    expect(first.authority.status).toBe("COMPLIANT");
    expect(first.evidence.operational).toBe(true);
    expect(first.report.explainable).toBe(true);
    expect(first.replay.reproducible).toBe(true);
    expect(first.boundary.executes_policy_enforcement).toBe(false);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustComplianceVerification(first).valid).toBe(true);
    expect(replayTrustComplianceVerification(first)).toBe(true);
  });

  it("qualifies P5.9 exit criteria", () => {
    const result = runTrustComplianceVerification();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.constitutional_engine_implemented).toBe(true);
    expect(result.certification.policy_engine_implemented).toBe(true);
    expect(result.certification.authority_engine_implemented).toBe(true);
    expect(result.certification.rule_registry_complete).toBe(true);
    expect(result.certification.evidence_registry_operational).toBe(true);
    expect(result.certification.reports_deterministic).toBe(true);
    expect(result.certification.replayable).toBe(true);
    expect(result.certification.inheritance_verified).toBe(true);
    expect(result.certification.explainable_lineage_complete).toBe(true);
    expect(result.certification.fail_closed_enforced).toBe(true);
    expect(result.certification.tenant_isolated_constitutional).toBe(true);
    expect(result.certification.boundary_respected).toBe(true);
  });

  it.each([
    "P5_7_TRUST_EVALUATION_INVALID",
    "P5_8_ALIGNMENT_VERIFICATION_INVALID",
    "CONSTITUTIONAL_COMPLIANCE_ENGINE_MISSING",
    "POLICY_COMPLIANCE_ENGINE_MISSING",
    "AUTHORITY_COMPLIANCE_ENGINE_MISSING",
    "COMPLIANCE_RULE_REGISTRY_MISSING",
    "COMPLIANCE_EVIDENCE_REGISTRY_MISSING",
    "COMPLIANCE_REPORT_MISSING",
    "CONSTITUTIONAL_VIOLATION_UNDETECTED",
    "POLICY_VIOLATION_UNDETECTED",
    "AUTHORITY_VIOLATION_UNDETECTED",
    "GOVERNANCE_INHERITANCE_INVALID",
    "CONSTITUTIONAL_INHERITANCE_INVALID",
    "AUTHORITY_GATE_NOT_VALIDATED",
    "POLICY_GATE_NOT_VALIDATED",
    "COMPLIANCE_NONDETERMINISTIC",
    "REPLAY_INVALID",
    "FINDING_NOT_EXPLAINABLE",
    "EVIDENCE_LINEAGE_INCOMPLETE",
    "GOVERNING_ARTIFACT_REFS_MISSING",
    "TENANT_ISOLATION_INVALID",
    "MISSING_EVIDENCE_NOT_FAIL_CLOSED",
    "CONFLICTING_EVIDENCE_NOT_FAIL_CLOSED",
    "STALE_EVIDENCE_NOT_FAIL_CLOSED",
    "UNVERIFIABLE_EVIDENCE_NOT_FAIL_CLOSED",
    "CONSTITUTIONAL_POLICY_CREATED",
    "GOVERNANCE_ACTION_EXECUTED",
    "AUTHORITY_DECISION_MADE",
    "POLICY_ENFORCEMENT_EXECUTED",
    "QUALIFICATION_DECISION_MADE",
  ] as const)("fails compliance verification for %s", (scenario: TrustComplianceScenario) => {
    const result = runTrustComplianceVerification({ scenario });
    const validation = validateTrustComplianceVerification(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("surfaces governance review when required", () => {
    const result = runTrustComplianceVerification({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.certification.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
  });

  it.each(["MISSING_EVIDENCE_NOT_FAIL_CLOSED", "CONFLICTING_EVIDENCE_NOT_FAIL_CLOSED", "STALE_EVIDENCE_NOT_FAIL_CLOSED", "UNVERIFIABLE_EVIDENCE_NOT_FAIL_CLOSED"] as const)("blocks inferred compliance for %s", (scenario: TrustComplianceScenario) => {
    const result = runTrustComplianceVerification({ scenario });

    expect(result.certification.fail_closed_enforced).toBe(false);
    expect(result.certification.phase_ready).toBe(false);
  });
});
