import { describe, expect, it } from "vitest";
import { getTrustConstitutionalFoundationBundle, replayTrustConstitutionalFoundation, runTrustConstitutionalFoundation, validateTrustConstitutionalFoundation } from "@/services/trust-constitutional-foundation";
import type { TrustConstitutionalScenario } from "@/types/trust-constitutional-foundation";

describe("Program 5 P5.0 Trust Constitutional Foundation", () => {
  it("publishes constitutional trust doctrine without owning later trust capabilities", () => {
    const bundle = getTrustConstitutionalFoundationBundle();

    expect(bundle.doctrine.version).toBe("trust-constitutional-foundation/v5.0");
    expect(bundle.doctrine.owns_trust_constitution).toBe(true);
    expect(bundle.doctrine.owns_constitutional_trust_doctrine).toBe(true);
    expect(bundle.doctrine.owns_trust_principles).toBe(true);
    expect(bundle.doctrine.owns_trust_terminology).toBe(true);
    expect(bundle.doctrine.owns_constitutional_invariants).toBe(true);
    expect(bundle.doctrine.owns_trust_governance).toBe(true);
    expect(bundle.doctrine.owns_trust_scoring).toBe(false);
    expect(bundle.doctrine.owns_trust_evaluation).toBe(false);
    expect(bundle.doctrine.owns_trust_evidence).toBe(false);
    expect(bundle.doctrine.owns_trust_reputation).toBe(false);
    expect(bundle.doctrine.owns_trust_certification).toBe(false);
    expect(bundle.doctrine.owns_trust_qualification).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds deterministic constitution, doctrine, principles, invariants, terminology, and boundaries", () => {
    const first = runTrustConstitutionalFoundation();
    const second = runTrustConstitutionalFoundation();

    expect(first.phase_identifier).toBe("TrustConstitutionalFoundation");
    expect(first.constitution.approved).toBe(true);
    expect(first.constitution.advisory_by_default).toBe(true);
    expect(first.constitution.creates_authority).toBe(false);
    expect(first.doctrine.finalized).toBe(true);
    expect(first.doctrine.doctrine_properties).toContain("evidence-derived");
    expect(first.principles.principles).toHaveLength(10);
    expect(first.invariants.invariant_refs).toContain("CTI-001:Trust never authorizes execution");
    expect(first.terminology.terminology).toContain("Trust Assurance");
    expect(first.boundaries.invalidates_on_violation).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustConstitutionalFoundation(first).valid).toBe(true);
    expect(replayTrustConstitutionalFoundation(first)).toBe(true);
  });

  it("certifies downstream inheritance and constitutional guardrails", () => {
    const result = runTrustConstitutionalFoundation();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.constitution_approved).toBe(true);
    expect(result.certification.doctrine_finalized).toBe(true);
    expect(result.certification.terminology_standardized).toBe(true);
    expect(result.certification.principles_adopted).toBe(true);
    expect(result.certification.invariants_immutable).toBe(true);
    expect(result.certification.governance_defined).toBe(true);
    expect(result.certification.authority_hierarchy_validated).toBe(true);
    expect(result.certification.boundaries_specified).toBe(true);
    expect(result.certification.vocabulary_registered).toBe(true);
    expect(result.certification.downstream_inheritance_ready).toBe(true);
    expect(result.certification.constitutional_guardrails_enforced).toBe(true);
    expect(result.certification.no_out_of_scope_ownership).toBe(true);
  });

  it.each([
    "PROGRAM_1_CONSTITUTIONAL_BASELINE_INVALID",
    "PROGRAM_1_CAPABILITY_ATLAS_INVALID",
    "PROGRAM_2_CONSTITUTIONAL_GOVERNANCE_INVALID",
    "PROGRAM_2_POLICY_FRAMEWORK_INVALID",
    "PROGRAM_2_IDENTITY_MODEL_INVALID",
    "PROGRAM_3_CONSTITUTIONAL_AUTHORITY_INVALID",
    "PROGRAM_3_GOVERNANCE_GATES_INVALID",
    "PROGRAM_4_APPLICATION_BOUNDARIES_INVALID",
    "TRUST_CONSTITUTION_MISSING",
    "TRUST_CONSTITUTION_NOT_APPROVED",
    "TRUST_DOCTRINE_MISSING",
    "TRUST_DOCTRINE_NOT_FINALIZED",
    "TRUST_TERMINOLOGY_MISSING",
    "TRUST_TERMINOLOGY_NOT_STANDARDIZED",
    "TRUST_PRINCIPLES_MISSING",
    "TRUST_PRINCIPLES_NOT_ADOPTED",
    "TRUST_INVARIANTS_MISSING",
    "TRUST_INVARIANTS_MUTABLE",
    "TRUST_GOVERNANCE_MISSING",
    "TRUST_GOVERNANCE_RESPONSIBILITIES_UNDEFINED",
    "TRUST_AUTHORITY_HIERARCHY_MISSING",
    "TRUST_AUTHORITY_HIERARCHY_INVALID",
    "TRUST_BOUNDARY_MODEL_MISSING",
    "TRUST_BOUNDARIES_UNSPECIFIED",
    "TRUST_VOCABULARY_NOT_REGISTERED",
    "TRUST_REFERENCE_MODEL_MISSING",
    "DOWNSTREAM_INHERITANCE_INVALID",
    "TRUST_SCORING_OWNERSHIP_ATTEMPTED",
    "TRUST_EVALUATION_OWNERSHIP_ATTEMPTED",
    "TRUST_EVIDENCE_OWNERSHIP_ATTEMPTED",
    "TRUST_REPUTATION_OWNERSHIP_ATTEMPTED",
    "TRUST_CERTIFICATION_OWNERSHIP_ATTEMPTED",
    "TRUST_QUALIFICATION_OWNERSHIP_ATTEMPTED",
    "TRUST_AUTHORITY_CREATION_ATTEMPTED",
    "GOVERNANCE_BYPASS_ATTEMPTED",
    "OPERATOR_AUTHORITY_REPLACED",
    "TENANT_ISOLATION_INVALID",
    "DETERMINISM_INVALID",
    "REPLAYABILITY_INVALID",
    "EXPLAINABILITY_INVALID",
    "AUDITABILITY_INVALID",
    "EVIDENCE_DERIVATION_INVALID",
    "FAIL_CLOSED_INVALID",
  ] as const)("fails trust constitutional certification for %s", (scenario: TrustConstitutionalScenario) => {
    const result = runTrustConstitutionalFoundation({ scenario });
    const validation = validateTrustConstitutionalFoundation(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runTrustConstitutionalFoundation({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
