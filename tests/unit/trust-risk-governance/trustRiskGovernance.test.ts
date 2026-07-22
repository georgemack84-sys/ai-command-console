import { describe, expect, it } from "vitest";
import { getTrustRiskGovernanceBundle, replayTrustRiskGovernance, runTrustRiskGovernance, validateTrustRiskGovernance } from "@/services/trust-risk-governance";
import type { TrustRiskGovernanceScenario } from "@/types/trust-risk-governance";

describe("Program 5 P5.6 Risk Modeling & Governance", () => {
  it("publishes risk doctrine without conflating risk with trust, confidence, authority, or policy", () => {
    const bundle = getTrustRiskGovernanceBundle();

    expect(bundle.doctrine.version).toBe("trust-risk-governance/v5.6");
    expect(bundle.doctrine.owns_autonomy_risk).toBe(true);
    expect(bundle.doctrine.owns_governance_risk).toBe(true);
    expect(bundle.doctrine.owns_operational_risk).toBe(true);
    expect(bundle.doctrine.owns_mission_risk).toBe(true);
    expect(bundle.doctrine.owns_trust_risk).toBe(true);
    expect(bundle.doctrine.risk_is_trust).toBe(false);
    expect(bundle.doctrine.risk_is_confidence).toBe(false);
    expect(bundle.doctrine.risk_grants_authority).toBe(false);
    expect(bundle.doctrine.risk_overrides_policy).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("computes deterministic, explainable, evidence-backed risk across five domains", () => {
    const first = runTrustRiskGovernance();
    const second = runTrustRiskGovernance();

    expect(first.phase_identifier).toBe("TrustRiskGovernance");
    expect(first.taxonomy.categories).toEqual(["AUTONOMY", "GOVERNANCE", "OPERATIONAL", "MISSION", "TRUST"]);
    expect(first.model.supported_categories).toHaveLength(5);
    expect(first.registry.risk_records.map((risk) => risk.risk_category)).toEqual(["AUTONOMY", "GOVERNANCE", "OPERATIONAL", "MISSION", "TRUST"]);
    expect(first.assessment.evidence_backed).toBe(true);
    expect(first.assessment.explainable).toBe(true);
    expect(first.aggregation.deterministic).toBe(true);
    expect(first.aggregation.normalized_score).toBeGreaterThanOrEqual(0);
    expect(first.aggregation.normalized_score).toBeLessThanOrEqual(1);
    expect(first.governance.confidence_separation_preserved).toBe(true);
    expect(first.governance.authority_separation_preserved).toBe(true);
    expect(first.report.explainable).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustRiskGovernance(first).valid).toBe(true);
    expect(replayTrustRiskGovernance(first)).toBe(true);
  });

  it("qualifies P5.6 exit criteria", () => {
    const result = runTrustRiskGovernance();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.five_domains_implemented).toBe(true);
    expect(result.certification.deterministic_computation_verified).toBe(true);
    expect(result.certification.aggregation_reproducible).toBe(true);
    expect(result.certification.assessments_explainable_evidence_backed).toBe(true);
    expect(result.certification.lineage_complete).toBe(true);
    expect(result.certification.governance_integrated).toBe(true);
    expect(result.certification.separation_preserved).toBe(true);
    expect(result.certification.canonical_artifacts_published).toBe(true);
    expect(result.certification.replay_tenant_audit_fail_closed).toBe(true);
  });

  it.each([
    "P5_0_TRUST_CONSTITUTION_INVALID",
    "P5_1_TRUST_ARCHITECTURE_INVALID",
    "P5_2_TRUST_REGISTRY_INVALID",
    "P5_3_RESTRICTION_POLICY_INVALID",
    "P5_4_AUTONOMY_CLASSIFICATION_INVALID",
    "P5_5_EVIDENCE_CONFIDENCE_INVALID",
    "RISK_TAXONOMY_MISSING",
    "RISK_MODEL_LIBRARY_MISSING",
    "RISK_RECORD_MISSING",
    "AUTONOMY_RISK_MISSING",
    "GOVERNANCE_RISK_MISSING",
    "OPERATIONAL_RISK_MISSING",
    "MISSION_RISK_MISSING",
    "TRUST_RISK_MISSING",
    "RISK_NOT_EVIDENCE_BASED",
    "RISK_CONFLATED_WITH_TRUST",
    "RISK_CONFLATED_WITH_CONFIDENCE",
    "RISK_GRANTS_AUTHORITY",
    "RISK_OVERRIDES_POLICY",
    "RISK_COMPUTATION_NONDETERMINISTIC",
    "RISK_AGGREGATION_NONREPRODUCIBLE",
    "RISK_EXPLANATION_INCOMPLETE",
    "RISK_LINEAGE_INCOMPLETE",
    "RISK_REPORT_MISSING",
    "RISK_LIFECYCLE_INVALID",
    "RISK_GOVERNANCE_MISSING",
    "RISK_REGISTRY_MISSING",
    "REPLAY_INVALID",
    "TENANT_ISOLATION_INVALID",
    "IMMUTABLE_AUDIT_INVALID",
    "FAIL_CLOSED_INVALID",
  ] as const)("fails risk qualification for %s", (scenario: TrustRiskGovernanceScenario) => {
    const result = runTrustRiskGovernance({ scenario });
    const validation = validateTrustRiskGovernance(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it.each(["GOVERNANCE_REVIEW_REQUIRED", "OPERATOR_REVIEW_REQUIRED"] as const)("surfaces review-required outcome for %s", (scenario: TrustRiskGovernanceScenario) => {
    const result = runTrustRiskGovernance({ scenario });

    expect(result.certification.outcome).toBe(scenario === "GOVERNANCE_REVIEW_REQUIRED" ? "REQUIRES_GOVERNANCE_REVIEW" : "REQUIRES_OPERATOR_REVIEW");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
  });

  it("keeps risk advisory and separated from confidence and authority", () => {
    const trust = runTrustRiskGovernance({ scenario: "RISK_CONFLATED_WITH_TRUST" });
    const confidence = runTrustRiskGovernance({ scenario: "RISK_CONFLATED_WITH_CONFIDENCE" });
    const authority = runTrustRiskGovernance({ scenario: "RISK_GRANTS_AUTHORITY" });

    expect(trust.certification.separation_preserved).toBe(false);
    expect(confidence.governance.confidence_separation_preserved).toBe(false);
    expect(authority.governance.authority_separation_preserved).toBe(false);
  });
});
