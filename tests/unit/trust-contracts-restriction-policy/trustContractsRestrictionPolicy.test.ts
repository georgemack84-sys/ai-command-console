import { describe, expect, it } from "vitest";
import { getTrustContractsRestrictionPolicyBundle, replayTrustContractsRestrictionPolicy, runTrustContractsRestrictionPolicy, validateTrustContractsRestrictionPolicy } from "@/services/trust-contracts-restriction-policy";
import type { TrustContractRestrictionPolicyScenario } from "@/types/trust-contracts-restriction-policy";

describe("Program 5 P5.3 Trust Contracts & Restriction Policy", () => {
  it("publishes restriction doctrine without executing policy, enforcement, scoring, or authority", () => {
    const bundle = getTrustContractsRestrictionPolicyBundle();

    expect(bundle.doctrine.version).toBe("trust-contracts-restriction-policy/v5.3");
    expect(bundle.doctrine.owns_trust_contracts).toBe(true);
    expect(bundle.doctrine.owns_restriction_policy).toBe(true);
    expect(bundle.doctrine.owns_standing_restrictions).toBe(true);
    expect(bundle.doctrine.owns_lifecycle_restrictions).toBe(true);
    expect(bundle.doctrine.owns_autonomy_restrictions).toBe(true);
    expect(bundle.doctrine.owns_restriction_composition).toBe(true);
    expect(bundle.doctrine.implements_runtime_enforcement).toBe(false);
    expect(bundle.doctrine.executes_policy_engine).toBe(false);
    expect(bundle.doctrine.calculates_trust_standing).toBe(false);
    expect(bundle.doctrine.grants_authority).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds deterministic contracts, policies, matrix, and effective restrictions", () => {
    const first = runTrustContractsRestrictionPolicy();
    const second = runTrustContractsRestrictionPolicy();

    expect(first.phase_identifier).toBe("TrustContractsRestrictionPolicy");
    expect(first.trust_constitution_ref).toBe("trust-constitutional-foundation/v5.0");
    expect(first.trust_architecture_ref).toBe("trust-architecture-alignment-foundation/v5.1");
    expect(first.trust_identity_boundary_ref).toBe("trust-identity-domains-boundaries/v5.2");
    expect(first.trust_contract.contract_status).toBe("ACTIVE");
    expect(first.trust_contract.grants_authority).toBe(false);
    expect(first.standing_policy.policy_name).toBe("TrustStandingRestrictionPolicy");
    expect(first.standing_policy.status).toBe("ACTIVE");
    expect(first.standing_policy.authorizes_execution).toBe(false);
    expect(first.standing_matrix.rows).toHaveLength(8);
    expect(first.precedence.precedence[0]).toBe("Trust Constitution");
    expect(first.precedence.precedence.at(-1)).toBe("Implementation Guidance");
    expect(first.composition.monotonic).toBe(true);
    expect(first.effective_restrictions.resolution_status).toBe("RESOLVED");
    expect(first.effective_restrictions.expands_permission).toBe(false);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustContractsRestrictionPolicy(first).valid).toBe(true);
    expect(replayTrustContractsRestrictionPolicy(first)).toBe(true);
  });

  it("qualifies every P5.3 exit gate", () => {
    const result = runTrustContractsRestrictionPolicy();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.trust_contract_model).toBe(true);
    expect(result.certification.trust_contract_lifecycle).toBe(true);
    expect(result.certification.standing_restriction_model).toBe(true);
    expect(result.certification.lifecycle_restriction_model).toBe(true);
    expect(result.certification.autonomy_restriction_model).toBe(true);
    expect(result.certification.restriction_precedence).toBe(true);
    expect(result.certification.monotonic_composition).toBe(true);
    expect(result.certification.tenant_isolation).toBe(true);
    expect(result.certification.trust_domain_containment).toBe(true);
    expect(result.certification.fail_closed_behavior).toBe(true);
    expect(result.certification.exception_governance).toBe(true);
    expect(result.certification.version_lineage_integrity).toBe(true);
    expect(result.certification.evidence_replay_contracts).toBe(true);
    expect(result.certification.registry_contracts).toBe(true);
    expect(result.certification.constitutional_alignment).toBe(true);
    expect(result.certification.no_out_of_scope_execution).toBe(true);
  });

  it.each([
    "P5_0_TRUST_CONSTITUTION_INVALID",
    "P5_1_TRUST_ARCHITECTURE_INVALID",
    "P5_2_TRUST_REGISTRY_INVALID",
    "TRUST_CONTRACT_MODEL_MISSING",
    "TRUST_CONTRACT_LIFECYCLE_INVALID",
    "TRUST_CONTRACT_SCHEMA_INVALID",
    "TRUST_CONTRACT_CROSSES_TENANT_BOUNDARY",
    "TRUST_DOMAIN_APPLICABILITY_IMPLICIT",
    "TRUST_BOUNDARY_APPLICABILITY_MISSING",
    "TRUST_CONTRACT_GRANTS_AUTHORITY",
    "TRUST_STANDING_AUTHORIZES_EXECUTION",
    "STANDING_RESTRICTION_POLICY_MISSING",
    "STANDING_POLICY_NOT_ACTIVE",
    "STANDING_RESTRICTION_MODEL_INVALID",
    "STANDING_VOCABULARY_REDEFINED",
    "STANDING_LIFECYCLE_CONFUSED",
    "LIFECYCLE_RESTRICTION_MODEL_INVALID",
    "AUTONOMY_RESTRICTION_MODEL_INVALID",
    "AUTONOMY_CEILING_EXPANDS_AUTHORITY",
    "RESTRICTION_PRECEDENCE_INVALID",
    "MONOTONIC_COMPOSITION_INVALID",
    "LOWER_PRECEDENCE_WEAKENS_HIGHER",
    "UNKNOWN_POLICY_DOES_NOT_FAIL_CLOSED",
    "MISSING_POLICY_DOES_NOT_FAIL_CLOSED",
    "EXPIRED_POLICY_DOES_NOT_FAIL_CLOSED",
    "RESTRICTION_EXCEPTION_UNGOVERNED",
    "EXCEPTION_OVERRIDES_CONSTITUTION",
    "VERSION_LINEAGE_MUTABLE",
    "SILENT_CONTRACT_MUTATION",
    "REGISTRY_CONTRACTS_MISSING",
    "REGISTRY_TENANT_PARTITION_INVALID",
    "EVIDENCE_REQUIREMENTS_INCOMPLETE",
    "REPLAY_CONTRACT_INVALID",
    "DETERMINISTIC_RESOLUTION_INVALID",
    "RUNTIME_ENFORCEMENT_IMPLEMENTED",
    "POLICY_ENGINE_EXECUTION_IMPLEMENTED",
    "TRUST_SCORING_IMPLEMENTED",
    "TRUST_EVALUATION_IMPLEMENTED",
    "SECURITY_MODEL_INVALID",
    "OBSERVABILITY_MODEL_INVALID",
  ] as const)("blocks phase readiness for %s", (scenario: TrustContractRestrictionPolicyScenario) => {
    const result = runTrustContractsRestrictionPolicy({ scenario });
    const validation = validateTrustContractsRestrictionPolicy(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it.each(["GOVERNANCE_REVIEW_REQUIRED", "OPERATOR_REVIEW_REQUIRED"] as const)("surfaces review-required outcomes for %s", (scenario: TrustContractRestrictionPolicyScenario) => {
    const result = runTrustContractsRestrictionPolicy({ scenario });

    expect(result.certification.outcome).toBe(scenario === "GOVERNANCE_REVIEW_REQUIRED" ? "REQUIRES_GOVERNANCE_REVIEW" : "REQUIRES_OPERATOR_REVIEW");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
  });

  it("keeps trust standing non-authorizing and restrictions monotonic", () => {
    const authority = runTrustContractsRestrictionPolicy({ scenario: "TRUST_STANDING_AUTHORIZES_EXECUTION" });
    const expansion = runTrustContractsRestrictionPolicy({ scenario: "MONOTONIC_COMPOSITION_INVALID" });

    expect(authority.certification.constitutional_alignment).toBe(false);
    expect(authority.boundary.grants_authority).toBe(true);
    expect(expansion.certification.monotonic_composition).toBe(false);
    expect(expansion.effective_restrictions.expands_permission).toBe(true);
  });
});
