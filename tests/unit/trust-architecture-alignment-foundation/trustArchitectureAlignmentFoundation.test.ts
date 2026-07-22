import { describe, expect, it } from "vitest";
import { getTrustArchitectureAlignmentFoundationBundle, replayTrustArchitectureAlignmentFoundation, runTrustArchitectureAlignmentFoundation, validateTrustArchitectureAlignmentFoundation } from "@/services/trust-architecture-alignment-foundation";
import type { TrustArchitectureAlignmentScenario } from "@/types/trust-architecture-alignment-foundation";

describe("Program 5 P5.1 Trust Architecture & Alignment Foundation", () => {
  it("publishes trust architecture doctrine without implementing later trust capabilities", () => {
    const bundle = getTrustArchitectureAlignmentFoundationBundle();

    expect(bundle.doctrine.version).toBe("trust-architecture-alignment-foundation/v5.1");
    expect(bundle.doctrine.owns_trust_architecture).toBe(true);
    expect(bundle.doctrine.owns_alignment_architecture).toBe(true);
    expect(bundle.doctrine.owns_trust_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_trust_services).toBe(true);
    expect(bundle.doctrine.owns_trust_operating_model).toBe(true);
    expect(bundle.doctrine.implements_trust_evaluation).toBe(false);
    expect(bundle.doctrine.implements_trust_scoring).toBe(false);
    expect(bundle.doctrine.implements_trust_evidence).toBe(false);
    expect(bundle.doctrine.implements_trust_policies).toBe(false);
    expect(bundle.doctrine.implements_runtime_trust_decisions).toBe(false);
    expect(bundle.doctrine.claims_execution_authority).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds deterministic trust architecture, alignment, service, lifecycle, and dependency records", () => {
    const first = runTrustArchitectureAlignmentFoundation();
    const second = runTrustArchitectureAlignmentFoundation();

    expect(first.phase_identifier).toBe("TrustArchitectureAlignmentFoundation");
    expect(first.portfolio_governance_ref).toBe("ecosystem-portfolio-governance/v4.20");
    expect(first.architecture.trust_constitution_ref).toBe("trust-constitution/v5.0");
    expect(first.architecture.advisory_by_default).toBe(true);
    expect(first.alignment.alignment_flow).toEqual(["Constitution", "Trust Principles", "Trust Architecture", "Alignment Architecture", "Trust Services", "Applications", "Operators"]);
    expect(first.alignment.authority_flows_upward).toBe(false);
    expect(first.services.service_refs).toEqual(["Trust Registry", "Trust Resolution", "Trust Validation", "Trust Queries", "Trust Lineage", "Trust Context"]);
    expect(first.lifecycle.states).toEqual(["DEFINED", "DESIGNED", "IMPLEMENTED", "VALIDATED", "ACTIVE", "MONITORING", "UNDER_REVIEW", "SUSPENDED", "RETIRED", "ARCHIVED"]);
    expect(first.dependencies.layer_stack[0]).toBe("Constitution Layer");
    expect(first.dependencies.circular_dependencies).toBe(false);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustArchitectureAlignmentFoundation(first).valid).toBe(true);
    expect(replayTrustArchitectureAlignmentFoundation(first)).toBe(true);
  });

  it("certifies architecture readiness for downstream trust implementation", () => {
    const result = runTrustArchitectureAlignmentFoundation();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.architecture_specified).toBe(true);
    expect(result.certification.alignment_defined).toBe(true);
    expect(result.certification.service_model_complete).toBe(true);
    expect(result.certification.lifecycle_specified).toBe(true);
    expect(result.certification.boundaries_documented).toBe(true);
    expect(result.certification.governance_integration_specified).toBe(true);
    expect(result.certification.cross_program_interfaces_documented).toBe(true);
    expect(result.certification.dependency_architecture_validated).toBe(true);
    expect(result.certification.replay_compatible).toBe(true);
    expect(result.certification.tenant_isolation_preserved).toBe(true);
    expect(result.certification.constitutional_compliance_verified).toBe(true);
    expect(result.certification.no_out_of_scope_implementation).toBe(true);
  });

  it.each([
    "P5_0_TRUST_CONSTITUTION_MISSING",
    "P4_20_PORTFOLIO_GOVERNANCE_INVALID",
    "TRUST_ARCHITECTURE_MISSING",
    "ALIGNMENT_ARCHITECTURE_MISSING",
    "TRUST_DOMAIN_MODEL_MISSING",
    "ALIGNMENT_DOMAIN_MODEL_MISSING",
    "TRUST_SERVICE_MODEL_MISSING",
    "TRUST_INTEGRATION_ARCHITECTURE_MISSING",
    "TRUST_GOVERNANCE_INTEGRATION_MISSING",
    "TRUST_OBSERVABILITY_ARCHITECTURE_MISSING",
    "TRUST_OPERATING_MODEL_MISSING",
    "TRUST_LIFECYCLE_MISSING",
    "LIFECYCLE_TRANSITION_INVALID",
    "LIFECYCLE_LINEAGE_MISSING",
    "SERVICE_CONTRACTS_MISSING",
    "ARCHITECTURE_CONTRACTS_MISSING",
    "DEPENDENCY_MODEL_INVALID",
    "CIRCULAR_DEPENDENCY_DETECTED",
    "LAYER_STACK_INVALID",
    "ALIGNMENT_FLOW_INVALID",
    "AUTHORITY_FLOW_UPWARD",
    "CROSS_PROGRAM_INTERFACES_MISSING",
    "GOVERNANCE_INTEGRATION_UNSPECIFIED",
    "REPLAY_COMPATIBILITY_MISSING",
    "TENANT_ISOLATION_INVALID",
    "CONSTITUTIONAL_COMPLIANCE_INVALID",
    "DETERMINISM_INVALID",
    "DOWNSTREAM_APPROVAL_MISSING",
    "TRUST_EVALUATION_IMPLEMENTED",
    "TRUST_SCORING_IMPLEMENTED",
    "TRUST_EVIDENCE_IMPLEMENTED",
    "TRUST_POLICY_IMPLEMENTED",
    "RUNTIME_TRUST_DECISION_IMPLEMENTED",
    "EXECUTION_AUTHORITY_CLAIMED",
  ] as const)("fails trust architecture certification for %s", (scenario: TrustArchitectureAlignmentScenario) => {
    const result = runTrustArchitectureAlignmentFoundation({ scenario });
    const validation = validateTrustArchitectureAlignmentFoundation(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runTrustArchitectureAlignmentFoundation({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
