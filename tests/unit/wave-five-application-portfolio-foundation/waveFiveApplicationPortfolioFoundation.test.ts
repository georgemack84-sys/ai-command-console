import { describe, expect, it } from "vitest";

import { getWaveFiveApplicationPortfolioFoundationBundle, replayWaveFiveApplicationPortfolioFoundation, runWaveFiveApplicationPortfolioFoundation, validateWaveFiveApplicationPortfolioFoundation } from "@/services/wave-five-application-portfolio-foundation";
import type { WaveFiveApplicationFoundationFailure } from "@/types/wave-five-application-portfolio-foundation";

const conditionalFailures = ["APPLICATION_CONSTITUTION_MISSING", "CONSTITUTIONAL_PRINCIPLES_MISSING", "APPLICATION_INVARIANTS_MISSING", "CONSTITUTIONAL_CONSTRAINTS_MISSING", "CONSTITUTIONAL_RESPONSIBILITIES_MISSING", "GOVERNANCE_PRINCIPLES_MISSING", "SEPARATION_OF_RESPONSIBILITIES_MISSING", "COMPLIANCE_REQUIREMENTS_MISSING", "PORTFOLIO_REGISTRY_MISSING", "APPLICATION_CATALOG_MISSING", "PORTFOLIO_CLASSIFICATION_MISSING", "PORTFOLIO_METADATA_MISSING", "PORTFOLIO_RELATIONSHIPS_MISSING", "PORTFOLIO_DISCOVERY_MISSING", "PORTFOLIO_SEARCH_MISSING", "PORTFOLIO_GOVERNANCE_MISSING", "PRODUCT_OWNERSHIP_MISSING", "TECHNICAL_OWNERSHIP_MISSING", "GOVERNANCE_OWNERSHIP_MISSING", "OPERATIONAL_OWNERSHIP_MISSING", "STEWARDSHIP_MODEL_MISSING", "AUTHORITY_ASSIGNMENTS_MISSING", "OWNERSHIP_POLICIES_MISSING", "OWNERSHIP_TRANSFERS_MISSING", "DEPENDENCY_REGISTRY_MISSING", "DEPENDENCY_GRAPH_MISSING", "SERVICE_DEPENDENCIES_MISSING", "PLATFORM_DEPENDENCIES_MISSING", "CROSS_APPLICATION_DEPENDENCIES_MISSING", "EXTERNAL_DEPENDENCIES_MISSING", "DEPENDENCY_VALIDATION_MISSING", "DEPENDENCY_GOVERNANCE_MISSING", "APPLICATION_LIFECYCLE_MISSING", "DEVELOPMENT_LIFECYCLE_MISSING", "DEPLOYMENT_LIFECYCLE_MISSING", "OPERATIONAL_LIFECYCLE_MISSING", "RETIREMENT_LIFECYCLE_MISSING", "SUSPENSION_WORKFLOW_MISSING", "RECOVERY_WORKFLOW_MISSING", "VERSION_LIFECYCLE_MISSING", "CERTIFICATION_CATEGORIES_MISSING", "CERTIFICATION_LEVELS_MISSING", "CERTIFICATION_REQUIREMENTS_MISSING", "CERTIFICATION_EVIDENCE_MISSING", "CERTIFICATION_POLICIES_MISSING", "CERTIFICATION_LIFECYCLE_MISSING", "CERTIFICATION_GOVERNANCE_MISSING", "CERTIFICATION_REFERENCES_MISSING", "GOVERNANCE_ROLES_MISSING", "GOVERNANCE_RESPONSIBILITIES_MISSING", "GOVERNANCE_REVIEWS_MISSING", "APPROVAL_AUTHORITIES_MISSING", "GOVERNANCE_ESCALATIONS_MISSING", "GOVERNANCE_EVIDENCE_MISSING", "GOVERNANCE_REPORTING_MISSING", "GOVERNANCE_METRICS_MISSING", "CCI_INTEGRATION_CONTRACTS_MISSING", "CAF_INTEGRATION_CONTRACTS_MISSING", "CATA_INTEGRATION_CONTRACTS_MISSING", "SERVICE_BOUNDARY_SPECIFICATIONS_MISSING", "CROSS_PROGRAM_CONTRACT_VALIDATION_MISSING"] as const satisfies readonly WaveFiveApplicationFoundationFailure[];
const failClosedFailures = ["CATA_PROGRAM_QUALIFICATION_INVALID", "PROGRAM_4_APPLICATION_FOUNDATION_INVALID", "PROGRAM_4_PORTFOLIO_GOVERNANCE_INVALID", "APPLICATION_CONSTITUTION_UNAPPROVED", "PORTFOLIO_GOVERNANCE_NONDETERMINISTIC", "SERVICE_BOUNDARIES_UNAPPROVED", "CONSTITUTIONAL_COMPLIANCE_FRAMEWORK_NOT_ADOPTED", "APPLICATION_FUNCTIONALITY_IMPLEMENTED", "AUTHORITY_OVERRIDE_ATTEMPTED", "TENANT_ISOLATION_WEAKENED", "EVIDENCE_MUTABLE"] as const satisfies readonly WaveFiveApplicationFoundationFailure[];

describe("Wave 5.0 Application Constitution and Portfolio Foundation", () => {
  it("publishes the Wave 5 application portfolio foundation doctrine", () => {
    const bundle = getWaveFiveApplicationPortfolioFoundationBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-application-portfolio-foundation/w5.0", constitutional_authority_for_wave_five: true, portfolio_governance_is_constitutional: true, application_functionality_prohibited: true, deterministic_portfolio_governance_required: true, cross_program_contracts_required: true, tenant_isolation_required: true, qualification_gate: "W5.0 Application Constitution and Portfolio Foundation Gate" });
    expect(bundle.result.readiness.decision).toBe("WAVE_FIVE_FOUNDATION_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and binds the Program 4 and CATA upstream authorities", () => {
    const first = runWaveFiveApplicationPortfolioFoundation({ seed: "deterministic" });
    const second = runWaveFiveApplicationPortfolioFoundation({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["trust-program-qualification-stage-thirteen/stage-13", "application-constitutional-foundation/v4.1", "ecosystem-portfolio-governance/v4.20"]);
    expect(first.provides).toEqual(["application-constitution", "portfolio-registry", "ownership-model", "dependency-registry", "lifecycle-model", "certification-model", "governance-model", "cross-program-integration-contracts"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFiveApplicationPortfolioFoundation(first).valid).toBe(true);
    expect(replayWaveFiveApplicationPortfolioFoundation()).toBe(true);
  });

  it("establishes the constitutional foundation without implementing application functionality", () => {
    const result = runWaveFiveApplicationPortfolioFoundation();

    expect(result.constitution).toMatchObject({ application_constitution: true, constitutional_principles: true, application_invariants: true, constitutional_constraints: true, constitutional_responsibilities: true, governance_principles: true, separation_of_responsibilities: true, compliance_requirements: true, approved: true, implements_application_functionality: false });
    expect(runWaveFiveApplicationPortfolioFoundation({ scenario: "APPLICATION_FUNCTIONALITY_IMPLEMENTED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runWaveFiveApplicationPortfolioFoundation({ scenario: "APPLICATION_CONSTITUTION_UNAPPROVED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("operates deterministic portfolio, ownership, and dependency registries", () => {
    const result = runWaveFiveApplicationPortfolioFoundation();

    expect(result.portfolio).toMatchObject({ portfolio_registry: true, application_catalog: true, portfolio_classification: true, portfolio_metadata: true, portfolio_relationships: true, portfolio_discovery: true, portfolio_search: true, portfolio_governance: true, deterministic: true });
    expect(result.ownership).toMatchObject({ product_ownership: true, technical_ownership: true, governance_ownership: true, operational_ownership: true, stewardship_model: true, authority_assignments: true, ownership_policies: true, ownership_transfers: true, responsibilities_assigned: true });
    expect(result.dependencies).toMatchObject({ dependency_registry: true, dependency_graph: true, service_dependencies: true, platform_dependencies: true, cross_application_dependencies: true, external_dependencies: true, dependency_validation: true, dependency_governance: true, deterministic: true });
    expect(runWaveFiveApplicationPortfolioFoundation({ scenario: "PORTFOLIO_GOVERNANCE_NONDETERMINISTIC" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("finalizes lifecycle states and certification dimensions", () => {
    const result = runWaveFiveApplicationPortfolioFoundation();

    expect(result.lifecycle.states).toEqual(["PROPOSED", "PLANNED", "DEVELOPMENT", "VALIDATION", "CERTIFIED", "OPERATIONAL", "SUSPENDED", "RETIRED", "ARCHIVED"]);
    expect(result.lifecycle).toMatchObject({ application_lifecycle: true, development_lifecycle: true, deployment_lifecycle: true, operational_lifecycle: true, retirement_lifecycle: true, suspension_workflow: true, recovery_workflow: true, version_lifecycle: true, state_machine_finalized: true });
    expect(result.certification.dimensions).toEqual(["CONSTITUTIONAL_COMPLIANCE", "ARCHITECTURE_COMPLIANCE", "SECURITY", "GOVERNANCE", "TRUST", "OPERATIONAL_READINESS", "REPLAY_SUPPORT", "EVIDENCE_INTEGRITY"]);
    expect(result.certification).toMatchObject({ certification_categories: true, certification_levels: true, certification_requirements: true, certification_evidence: true, certification_policies: true, certification_lifecycle: true, certification_governance: true, certification_references: true, approved: true });
  });

  it("establishes governance and cross-program integration contracts", () => {
    const result = runWaveFiveApplicationPortfolioFoundation();

    expect(result.governance).toMatchObject({ governance_roles: true, governance_responsibilities: true, governance_reviews: true, approval_authorities: true, governance_escalations: true, governance_evidence: true, governance_reporting: true, governance_metrics: true, established: true });
    expect(result.integrations).toMatchObject({ cci_identity_registry_messaging_evidence_replay: true, caf_agent_capability_planning_runtime_memory: true, cata_trust_compliance_evidence_oversight_certification: true, dependency_contracts: true, service_boundary_specifications: true, cross_program_contract_validation: true, boundaries_approved: true });
    expect(runWaveFiveApplicationPortfolioFoundation({ scenario: "SERVICE_BOUNDARIES_UNAPPROVED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("publishes immutable evidence and readiness for Wave 5 implementations", () => {
    const result = runWaveFiveApplicationPortfolioFoundation();

    expect(result.evidence).toMatchObject({ constitutional_specification: true, rule_set: true, invariant_registry: true, portfolio_registry_evidence: true, ownership_evidence: true, dependency_evidence: true, lifecycle_evidence: true, certification_evidence: true, governance_evidence: true, integration_evidence: true, immutable: true, replayable: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, upstream_ready: true, constitution_ready: true, portfolio_ready: true, ownership_ready: true, dependency_ready: true, lifecycle_ready: true, certification_ready: true, governance_ready: true, integrations_ready: true, evidence_ready: true, portfolio_governance_deterministic: true, constitutional_compliance_adopted: true, service_boundaries_approved: true, tenant_isolation_preserved: true, no_authority_override: true, foundation_ready_for_implementations: true });
    expect(runWaveFiveApplicationPortfolioFoundation({ scenario: "TENANT_ISOLATION_WEAKENED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runWaveFiveApplicationPortfolioFoundation({ scenario: "AUTHORITY_OVERRIDE_ATTEMPTED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runWaveFiveApplicationPortfolioFoundation({ scenario: "EVIDENCE_MUTABLE" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runWaveFiveApplicationPortfolioFoundation({ scenario: "CONSTITUTIONAL_COMPLIANCE_FRAMEWORK_NOT_ADOPTED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFiveApplicationPortfolioFoundation({ scenario: failure });
    const validation = validateWaveFiveApplicationPortfolioFoundation(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runWaveFiveApplicationPortfolioFoundation({ scenario: failure });
    const validation = validateWaveFiveApplicationPortfolioFoundation(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed foundation outcomes", () => {
    const observed = runWaveFiveApplicationPortfolioFoundation({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFiveApplicationPortfolioFoundation({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFiveApplicationPortfolioFoundation({ scenario: "WAVE_FIVE_FOUNDATION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFiveApplicationPortfolioFoundation(notQualified).valid).toBe(false);
  });
});
