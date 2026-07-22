import { describe, expect, it } from "vitest";
import { getTrustEvidenceConfidenceBundle, replayTrustEvidenceConfidence, runTrustEvidenceConfidence, validateTrustEvidenceConfidence } from "@/services/trust-evidence-confidence";
import type { TrustEvidenceConfidenceScenario } from "@/types/trust-evidence-confidence";

describe("Program 5 P5.5 Trust Evidence & Confidence", () => {
  it("publishes evidence and confidence doctrine without treating confidence as trust or authority", () => {
    const bundle = getTrustEvidenceConfidenceBundle();

    expect(bundle.doctrine.version).toBe("trust-evidence-confidence/v5.5");
    expect(bundle.doctrine.owns_trust_evidence).toBe(true);
    expect(bundle.doctrine.owns_confidence_modeling).toBe(true);
    expect(bundle.doctrine.owns_evidence_aggregation).toBe(true);
    expect(bundle.doctrine.owns_confidence_computation).toBe(true);
    expect(bundle.doctrine.owns_evidence_lineage).toBe(true);
    expect(bundle.doctrine.owns_confidence_reporting).toBe(true);
    expect(bundle.doctrine.owns_authority_decisions).toBe(false);
    expect(bundle.doctrine.owns_trust_contracts).toBe(false);
    expect(bundle.doctrine.confidence_is_trust).toBe(false);
    expect(bundle.doctrine.confidence_grants_authority).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("computes deterministic, bounded, evidence-backed confidence with lineage", () => {
    const first = runTrustEvidenceConfidence();
    const second = runTrustEvidenceConfidence();

    expect(first.phase_identifier).toBe("TrustEvidenceConfidence");
    expect(first.evidence_registry.evidence_records).toHaveLength(3);
    expect(first.evidence_registry.taxonomy).toContain("BEHAVIORAL");
    expect(first.quality_model.normalized_quality).toBeGreaterThan(0);
    expect(first.quality_model.normalized_quality).toBeLessThanOrEqual(1);
    expect(first.aggregation.deterministic).toBe(true);
    expect(first.confidence.confidence_score).toBeGreaterThanOrEqual(0);
    expect(first.confidence.confidence_score).toBeLessThanOrEqual(1);
    expect(first.confidence.evidence_backed).toBe(true);
    expect(first.confidence.trust_granting).toBe(false);
    expect(first.confidence.authority_granting).toBe(false);
    expect(first.lineage.complete).toBe(true);
    expect(first.report.explainable).toBe(true);
    expect(first.governance.trust_decisions_not_based_solely_on_confidence).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustEvidenceConfidence(first).valid).toBe(true);
    expect(replayTrustEvidenceConfidence(first)).toBe(true);
  });

  it("qualifies P5.5 for downstream P5.6 consumption", () => {
    const result = runTrustEvidenceConfidence();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.evidence_registry_operational).toBe(true);
    expect(result.certification.evidence_lineage_complete).toBe(true);
    expect(result.certification.confidence_deterministic_replayable).toBe(true);
    expect(result.certification.aggregation_reproducible).toBe(true);
    expect(result.certification.confidence_models_documented).toBe(true);
    expect(result.certification.reports_explainable_evidence_backed).toBe(true);
    expect(result.certification.governance_prevents_override).toBe(true);
    expect(result.certification.immutable_lineage_referenced).toBe(true);
    expect(result.certification.invariants_valid).toBe(true);
    expect(result.certification.approved_for_p5_6).toBe(true);
  });

  it.each([
    "P5_1_TRUST_ARCHITECTURE_INVALID",
    "P5_2_TRUST_REGISTRY_INVALID",
    "P5_3_RESTRICTION_POLICY_INVALID",
    "P5_4_AUTONOMY_CLASSIFICATION_INVALID",
    "TRUST_EVIDENCE_REGISTRY_MISSING",
    "EVIDENCE_TAXONOMY_MISSING",
    "EVIDENCE_RECORD_MISSING",
    "EVIDENCE_INTEGRITY_INVALID",
    "EVIDENCE_LINEAGE_INCOMPLETE",
    "EVIDENCE_QUALITY_MODEL_INVALID",
    "EVIDENCE_AGGREGATION_NONDETERMINISTIC",
    "DUPLICATE_EVIDENCE_NOT_ELIMINATED",
    "CONTRADICTION_NOT_DETECTED",
    "CONFIDENCE_MODEL_MISSING",
    "CONFIDENCE_NOT_EVIDENCE_BASED",
    "CONFIDENCE_COMPUTATION_NONDETERMINISTIC",
    "CONFIDENCE_NOT_REPLAYABLE",
    "CONFIDENCE_NOT_EXPLAINABLE",
    "CONFIDENCE_UNBOUNDED",
    "CONFIDENCE_INFLATED",
    "CONFIDENCE_OVERRIDES_GOVERNANCE",
    "CONFIDENCE_TREATED_AS_TRUST",
    "CONFIDENCE_GRANTS_AUTHORITY",
    "CONFIDENCE_REPORT_MISSING",
    "GOVERNANCE_CONTRACTS_MISSING",
    "OBSERVABILITY_MODEL_MISSING",
  ] as const)("fails P5.5 certification for %s", (scenario: TrustEvidenceConfidenceScenario) => {
    const result = runTrustEvidenceConfidence({ scenario });
    const validation = validateTrustEvidenceConfidence(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("surfaces governance review without granting readiness", () => {
    const result = runTrustEvidenceConfidence({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.certification.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
  });

  it("keeps high confidence separate from trust and authority", () => {
    const trust = runTrustEvidenceConfidence({ scenario: "CONFIDENCE_TREATED_AS_TRUST" });
    const authority = runTrustEvidenceConfidence({ scenario: "CONFIDENCE_GRANTS_AUTHORITY" });

    expect(trust.confidence.trust_granting).toBe(true);
    expect(trust.certification.governance_prevents_override).toBe(false);
    expect(authority.confidence.authority_granting).toBe(true);
    expect(authority.governance.confidence_never_overrides_authority).toBe(false);
  });
});
