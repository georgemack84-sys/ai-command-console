import { describe, expect, it } from "vitest";
import { getAutonomyClassificationFrameworkBundle, replayAutonomyClassificationFramework, runAutonomyClassificationFramework, validateAutonomyClassificationFramework } from "@/services/autonomy-classification-framework";
import type { AutonomyClassificationScenario } from "@/types/autonomy-classification-framework";

describe("Program 5 P5.4 Autonomy Classification Framework", () => {
  it("publishes autonomy classification doctrine without granting execution or authority", () => {
    const bundle = getAutonomyClassificationFrameworkBundle();

    expect(bundle.doctrine.version).toBe("autonomy-classification-framework/v5.4");
    expect(bundle.doctrine.owns_caf_autonomy_classification).toBe(true);
    expect(bundle.doctrine.owns_autonomy_taxonomy).toBe(true);
    expect(bundle.doctrine.owns_autonomy_levels).toBe(true);
    expect(bundle.doctrine.owns_authority_classes).toBe(true);
    expect(bundle.doctrine.owns_autonomy_eligibility).toBe(true);
    expect(bundle.doctrine.executes_authority_decisions).toBe(false);
    expect(bundle.doctrine.grants_autonomy_execution).toBe(false);
    expect(bundle.doctrine.grants_execution_authority).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds deterministic autonomy classification, taxonomy, levels, and authority matrix", () => {
    const first = runAutonomyClassificationFramework();
    const second = runAutonomyClassificationFramework();

    expect(first.phase_identifier).toBe("AutonomyClassificationFramework");
    expect(first.trust_constitution_ref).toBe("trust-constitutional-foundation/v5.0");
    expect(first.trust_architecture_ref).toBe("trust-architecture-alignment-foundation/v5.1");
    expect(first.trust_identity_boundary_ref).toBe("trust-identity-domains-boundaries/v5.2");
    expect(first.trust_restriction_policy_ref).toBe("trust-contracts-restriction-policy/v5.3");
    expect(first.classification.autonomy_category).toBe("GUIDED");
    expect(first.classification.autonomy_level).toBe("LEVEL_2_OPERATOR_ASSISTED");
    expect(first.classification.authority_class).toBe("ADVISORY");
    expect(first.taxonomy.categories).toHaveLength(8);
    expect(first.levels.levels).toHaveLength(6);
    expect(first.authority_classes.authority_classes).toHaveLength(7);
    expect(first.registry.classifications).toHaveLength(1);
    expect(first.authority_matrix.mappings).toHaveLength(6);
    expect(first.pipeline.steps).toEqual(["Capability", "Resolve Autonomy Classification", "Resolve Authority Class", "Evaluate Trust Standing", "Evaluate Restrictions", "Determine Eligibility", "Classification Result"]);
    expect(first.eligibility.eligibility_status).toBe("ELIGIBLE_WITH_RESTRICTIONS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateAutonomyClassificationFramework(first).valid).toBe(true);
    expect(replayAutonomyClassificationFramework(first)).toBe(true);
  });

  it("qualifies the P5.4 exit criteria", () => {
    const result = runAutonomyClassificationFramework();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.classification_defined).toBe(true);
    expect(result.certification.taxonomy_finalized).toBe(true);
    expect(result.certification.autonomy_levels_defined).toBe(true);
    expect(result.certification.authority_classes_established).toBe(true);
    expect(result.certification.eligibility_rules_deterministic).toBe(true);
    expect(result.certification.registry_operational).toBe(true);
    expect(result.certification.classification_rules_complete).toBe(true);
    expect(result.certification.authority_matrix_published).toBe(true);
    expect(result.certification.classifications_replayable).toBe(true);
    expect(result.certification.fail_closed_unknown_invalid).toBe(true);
    expect(result.certification.no_out_of_scope_execution).toBe(true);
  });

  it.each([
    "P5_0_TRUST_CONSTITUTION_INVALID",
    "P5_1_TRUST_ARCHITECTURE_INVALID",
    "P5_2_TRUST_REGISTRY_INVALID",
    "P5_3_RESTRICTION_POLICY_INVALID",
    "CAF_AUTONOMY_CLASSIFICATION_MISSING",
    "AUTONOMY_TAXONOMY_MISSING",
    "AUTONOMY_LEVELS_MISSING",
    "AUTHORITY_CLASSES_MISSING",
    "AUTONOMY_ELIGIBILITY_MISSING",
    "CLASSIFICATION_REGISTRY_MISSING",
    "CLASSIFICATION_RULES_INCOMPLETE",
    "AUTHORITY_MATRIX_MISSING",
    "CLASSIFICATION_NOT_DETERMINISTIC",
    "MULTIPLE_ACTIVE_CLASSIFICATIONS",
    "NO_ACTIVE_CLASSIFICATION",
    "AUTHORITY_EXCEEDS_CONSTITUTION",
    "ELIGIBILITY_DOES_NOT_FAIL_CLOSED",
    "TRUST_CONTRACT_BYPASS_ATTEMPTED",
    "RESTRICTION_POLICY_BYPASS_ATTEMPTED",
    "AUTHORITY_GATE_BYPASS_ATTEMPTED",
    "POLICY_GATE_BYPASS_ATTEMPTED",
    "SAFETY_GATE_BYPASS_ATTEMPTED",
    "INHERITANCE_WEAKENS_RESTRICTIONS",
    "UNKNOWN_CLASSIFICATION_ACCEPTED",
    "TRUST_COMPATIBILITY_INVALID",
    "RESTRICTION_COMPATIBILITY_INVALID",
    "GOVERNANCE_COMPATIBILITY_INVALID",
    "REPLAY_REPRODUCIBILITY_INVALID",
    "CERTIFICATION_INCOMPLETE",
    "RUNTIME_AUTHORITY_DECISION_EXECUTED",
    "AUTONOMY_EXECUTION_GRANTED",
  ] as const)("blocks autonomy classification readiness for %s", (scenario: AutonomyClassificationScenario) => {
    const result = runAutonomyClassificationFramework({ scenario });
    const validation = validateAutonomyClassificationFramework(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it.each(["GOVERNANCE_REVIEW_REQUIRED", "OPERATOR_REVIEW_REQUIRED"] as const)("surfaces review-required outcomes for %s", (scenario: AutonomyClassificationScenario) => {
    const result = runAutonomyClassificationFramework({ scenario });

    expect(result.certification.outcome).toBe(scenario === "GOVERNANCE_REVIEW_REQUIRED" ? "REQUIRES_GOVERNANCE_REVIEW" : "REQUIRES_OPERATOR_REVIEW");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
  });

  it("rejects authority and gate bypass escalation", () => {
    const authority = runAutonomyClassificationFramework({ scenario: "AUTONOMY_EXECUTION_GRANTED" });
    const gate = runAutonomyClassificationFramework({ scenario: "SAFETY_GATE_BYPASS_ATTEMPTED" });

    expect(authority.boundary.grants_autonomy_execution).toBe(true);
    expect(authority.certification.no_out_of_scope_execution).toBe(false);
    expect(gate.classification.bypasses_safety_gate).toBe(true);
    expect(gate.certification.phase_ready).toBe(false);
  });
});
