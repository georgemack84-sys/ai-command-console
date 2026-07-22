import { describe, expect, it } from "vitest";
import { getTrustEvaluationEngineBundle, replayTrustEvaluationEngine, runTrustEvaluationEngine, validateTrustEvaluationEngine } from "@/services/trust-evaluation-engine";
import type { TrustEvaluationScenario } from "@/types/trust-evaluation-engine";

describe("Program 5 P5.7 Trust Evaluation Engine", () => {
  it("publishes evaluation doctrine without creating evidence or overriding governance", () => {
    const bundle = getTrustEvaluationEngineBundle();

    expect(bundle.doctrine.version).toBe("trust-evaluation-engine/v5.7");
    expect(bundle.doctrine.owns_trust_evaluation).toBe(true);
    expect(bundle.doctrine.owns_trust_decisions).toBe(true);
    expect(bundle.doctrine.owns_trust_standing).toBe(true);
    expect(bundle.doctrine.owns_autonomy_eligibility_evaluation).toBe(true);
    expect(bundle.doctrine.creates_evidence).toBe(false);
    expect(bundle.doctrine.modifies_evidence).toBe(false);
    expect(bundle.doctrine.overrides_governance).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("produces deterministic, explainable, replayable trust decisions from verified evidence", () => {
    const first = runTrustEvaluationEngine();
    const second = runTrustEvaluationEngine();

    expect(first.phase_identifier).toBe("TrustEvaluationEngine");
    expect(first.evidence_package.completeness_status).toBe("COMPLETE");
    expect(first.evidence_package.evidence_refs).toHaveLength(3);
    expect(first.confidence.confidence_validated).toBe(true);
    expect(first.risk.risk_validated).toBe(true);
    expect(first.rules.governance_supremacy_enforced).toBe(true);
    expect(first.rules.restriction_policies_honored).toBe(true);
    expect(first.standing.standing).toBe("CONDITIONALLY_TRUSTED");
    expect(first.standing.derived_from_evidence).toBe(true);
    expect(first.autonomy_eligibility.decision).toBe("ELIGIBLE_WITH_RESTRICTIONS");
    expect(first.decision.decision).toBe("APPROVE_WITH_RESTRICTIONS");
    expect(first.decision.non_authorizing).toBe(true);
    expect(first.explanation.complete).toBe(true);
    expect(first.replay_package.reproducible).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustEvaluationEngine(first).valid).toBe(true);
    expect(replayTrustEvaluationEngine(first)).toBe(true);
  });

  it("qualifies the P5.7 exit criteria", () => {
    const result = runTrustEvaluationEngine();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.engine_implemented).toBe(true);
    expect(result.certification.deterministic_evaluation_operational).toBe(true);
    expect(result.certification.decisions_replayable_explainable).toBe(true);
    expect(result.certification.standing_deterministic).toBe(true);
    expect(result.certification.autonomy_eligibility_operational).toBe(true);
    expect(result.certification.constitutional_rules_enforced).toBe(true);
    expect(result.certification.governance_restrictions_honored).toBe(true);
    expect(result.certification.fail_closed_verified).toBe(true);
    expect(result.certification.certification_evidence_complete).toBe(true);
  });

  it.each([
    "P5_1_TRUST_ARCHITECTURE_INVALID",
    "P5_2_TRUST_REGISTRY_INVALID",
    "P5_3_RESTRICTION_POLICY_INVALID",
    "P5_4_AUTONOMY_CLASSIFICATION_INVALID",
    "P5_5_EVIDENCE_CONFIDENCE_INVALID",
    "P5_6_RISK_GOVERNANCE_INVALID",
    "EVALUATION_ENGINE_MISSING",
    "EVIDENCE_PACKAGE_MISSING",
    "EVIDENCE_MISSING",
    "EVIDENCE_STALE",
    "EVIDENCE_CONFLICTING",
    "EVIDENCE_UNVERIFIABLE",
    "EVIDENCE_CORRUPTED",
    "EVIDENCE_OUTSIDE_BOUNDARY",
    "CONFIDENCE_INTEGRATION_INVALID",
    "RISK_INTEGRATION_INVALID",
    "TRUST_RULE_EVALUATION_INVALID",
    "HIGH_TRUST_NEGATES_UNACCEPTABLE_RISK",
    "CONFIDENCE_TREATED_AS_TRUST",
    "TRUST_STANDING_ARBITRARY",
    "TRUST_STANDING_NONDETERMINISTIC",
    "AUTONOMY_ELIGIBILITY_INVALID",
    "TRUST_DECISION_MISSING",
    "TRUST_DECISION_NONDETERMINISTIC",
    "TRUST_DECISION_AUTHORIZES_WITHOUT_EVIDENCE",
    "TRUST_DECISION_VIOLATES_CONSTITUTION",
    "EXPLANATION_INCOMPLETE",
    "REPLAY_PACKAGE_INVALID",
    "OBSERVABILITY_MISSING",
    "CERTIFICATION_EVIDENCE_INCOMPLETE",
  ] as const)("fails evaluation certification for %s", (scenario: TrustEvaluationScenario) => {
    const result = runTrustEvaluationEngine({ scenario });
    const validation = validateTrustEvaluationEngine(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it.each([
    ["GOVERNANCE_RESTRICTIONS_IGNORED", "REQUIRES_GOVERNANCE_REVIEW"],
    ["RESTRICTION_POLICIES_IGNORED", "REQUIRES_OPERATOR_REVIEW"],
  ] as const)("surfaces review outcome for %s", (scenario: TrustEvaluationScenario, outcome) => {
    const result = runTrustEvaluationEngine({ scenario });

    expect(result.certification.outcome).toBe(outcome);
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
  });

  it.each(["EVIDENCE_MISSING", "EVIDENCE_STALE", "EVIDENCE_CONFLICTING", "EVIDENCE_UNVERIFIABLE", "EVIDENCE_CORRUPTED", "EVIDENCE_OUTSIDE_BOUNDARY"] as const)("fails closed for %s", (scenario: TrustEvaluationScenario) => {
    const result = runTrustEvaluationEngine({ scenario });

    expect(result.decision.decision).toBe("DENY");
    expect(result.standing.standing).toBe("UNTRUSTED");
    expect(result.certification.fail_closed_verified).toBe(true);
  });
});
