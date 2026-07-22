import { describe, expect, it } from "vitest";
import { getTrustAlignmentVerificationBundle, replayTrustAlignmentVerification, runTrustAlignmentVerification, validateTrustAlignmentVerification } from "@/services/trust-alignment-verification";
import type { TrustAlignmentVerificationScenario } from "@/types/trust-alignment-verification";

describe("Program 5 P5.8 Alignment Verification", () => {
  it("publishes alignment doctrine without owning trust evaluation, autonomy classification, risk, or certification", () => {
    const bundle = getTrustAlignmentVerificationBundle();

    expect(bundle.doctrine.version).toBe("trust-alignment-verification/v5.8");
    expect(bundle.doctrine.owns_alignment_verification).toBe(true);
    expect(bundle.doctrine.owns_behavioral_verification).toBe(true);
    expect(bundle.doctrine.owns_objective_verification).toBe(true);
    expect(bundle.doctrine.owns_mission_alignment).toBe(true);
    expect(bundle.doctrine.owns_constitutional_alignment).toBe(true);
    expect(bundle.doctrine.owns_trust_evaluation).toBe(false);
    expect(bundle.doctrine.classifies_autonomy).toBe(false);
    expect(bundle.doctrine.computes_risk).toBe(false);
    expect(bundle.doctrine.issues_certification).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("verifies deterministic constitutional, mission, behavioral, and objective alignment", () => {
    const first = runTrustAlignmentVerification();
    const second = runTrustAlignmentVerification();

    expect(first.phase_identifier).toBe("TrustAlignmentVerification");
    expect(first.constitutional.doctrine_supreme).toBe(true);
    expect(first.mission.constitutional_subordinate).toBe(true);
    expect(first.behavioral.deterministic).toBe(true);
    expect(first.behavioral.divergence_detected).toBe(false);
    expect(first.objective.objective_conflicts).toHaveLength(0);
    expect(first.alignment.findings).toContain("SUBSTANTIALLY_ALIGNED");
    expect(first.engine.workflow_steps).toHaveLength(9);
    expect(first.engine.preserves_trust_decisions).toBe(true);
    expect(first.engine.independent_of_trust_evaluation).toBe(true);
    expect(first.report.explainable).toBe(true);
    expect(first.continuous.supported).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustAlignmentVerification(first).valid).toBe(true);
    expect(replayTrustAlignmentVerification(first)).toBe(true);
  });

  it("qualifies P5.8 exit criteria", () => {
    const result = runTrustAlignmentVerification();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.constitutional_alignment_implemented).toBe(true);
    expect(result.certification.mission_alignment_operational).toBe(true);
    expect(result.certification.behavioral_verification_deterministic_evidence_based).toBe(true);
    expect(result.certification.objective_verification_conflicts_detected).toBe(true);
    expect(result.certification.findings_reproducible).toBe(true);
    expect(result.certification.evidence_lineage_preserved).toBe(true);
    expect(result.certification.reports_generated).toBe(true);
    expect(result.certification.continuous_assessment_supported).toBe(true);
    expect(result.certification.invariants_valid).toBe(true);
    expect(result.certification.integrates_p5_4_to_p5_7).toBe(true);
  });

  it.each([
    "P5_4_AUTONOMY_CLASSIFICATION_INVALID",
    "P5_5_TRUST_EVIDENCE_INVALID",
    "P5_6_RISK_MODEL_INVALID",
    "P5_7_TRUST_DECISION_INVALID",
    "CONSTITUTIONAL_ALIGNMENT_ENGINE_MISSING",
    "MISSION_ALIGNMENT_ENGINE_MISSING",
    "BEHAVIORAL_VERIFICATION_ENGINE_MISSING",
    "OBJECTIVE_VERIFICATION_ENGINE_MISSING",
    "ALIGNMENT_EVIDENCE_REGISTRY_MISSING",
    "ALIGNMENT_FINDINGS_REGISTRY_MISSING",
    "ALIGNMENT_REPORT_MISSING",
    "CONSTITUTIONAL_DOCTRINE_OVERRIDDEN",
    "MISSION_OVERRIDES_CONSTITUTION",
    "TRUST_DECISION_NOT_PRESERVED",
    "VERIFICATION_NONDETERMINISTIC",
    "FINDING_NOT_REPRODUCIBLE",
    "EVIDENCE_NOT_VERIFIED",
    "EVIDENCE_LINEAGE_INCOMPLETE",
    "EVIDENCE_MUTABLE",
    "MISSING_EVIDENCE_TREATED_AS_ALIGNED",
    "CONSTITUTIONAL_VIOLATION_NOT_MISALIGNED",
    "TRUST_EVALUATION_DUPLICATED",
    "AUTONOMY_CLASSIFICATION_REDEFINED",
    "RISK_COMPUTATION_DUPLICATED",
    "CERTIFICATION_ISSUED",
    "CONTINUOUS_ASSESSMENT_MISSING",
  ] as const)("fails alignment verification for %s", (scenario: TrustAlignmentVerificationScenario) => {
    const result = runTrustAlignmentVerification({ scenario });
    const validation = validateTrustAlignmentVerification(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("surfaces governance review when required", () => {
    const result = runTrustAlignmentVerification({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.certification.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
  });

  it("classifies constitutional violations as constitutionally misaligned", () => {
    const result = runTrustAlignmentVerification({ scenario: "CONSTITUTIONAL_DOCTRINE_OVERRIDDEN" });

    expect(result.constitutional.violated_requirements).toContain("constitutional doctrine");
    expect(result.alignment.findings).toContain("CONSTITUTIONALLY_MISALIGNED");
    expect(result.certification.phase_ready).toBe(false);
  });
});
