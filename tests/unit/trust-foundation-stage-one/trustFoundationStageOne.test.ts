import { describe, expect, it } from "vitest";

import { getTrustFoundationStageOneBundle, replayTrustFoundationStageOne, runTrustFoundationStageOne, validateTrustFoundationStageOne } from "@/services/trust-foundation-stage-one";
import type { TrustFoundationStageOneFailure } from "@/types/trust-foundation-stage-one";

const conditionalFailures = ["TRUST_APIS_MISSING", "API_CONTRACTS_MISSING", "ADMINISTRATIVE_APIS_MISSING", "TRUST_CONTRACTS_MISSING", "CONTRACT_CATALOG_MISSING", "EVENT_CONTRACTS_MISSING", "CONTRACT_VERSIONING_MISSING", "TRUST_LIFECYCLE_MISSING", "LIFECYCLE_TRANSITION_RULES_MISSING", "REVOCATION_LIFECYCLE_MISSING", "ARCHIVAL_LIFECYCLE_MISSING", "TRUST_GOVERNANCE_MODEL_MISSING", "AUTHORITY_MATRIX_MISSING", "EXCEPTION_GOVERNANCE_MISSING"] as const satisfies readonly TrustFoundationStageOneFailure[];
const failClosedFailures = ["P5_0_TRUST_CONSTITUTION_INVALID", "P5_1_TRUST_ARCHITECTURE_INVALID", "LAYER_0_CONSTITUTIONAL_FRAMEWORKS_INVALID", "CCI_INFRASTRUCTURE_INVALID", "CAF_CONSTITUTIONAL_FOUNDATION_INVALID", "CAF_CATA_INTEGRATION_CONTRACTS_INVALID", "TENANT_INTEGRATION_CONTRACT_INVALID", "TRUST_CONSTITUTION_MISSING", "TRUST_CONSTITUTION_NOT_APPROVED", "CONSTITUTIONAL_RULES_MISSING", "INVARIANT_REGISTRY_MISSING", "FAIL_CLOSED_RULES_MISSING", "TRUST_ARCHITECTURE_MISSING", "SERVICE_DECOMPOSITION_MISSING", "DEPENDENCY_MODEL_MISSING", "INTEGRATION_ARCHITECTURE_MISSING", "MULTI_TENANT_ARCHITECTURE_MISSING", "TRUST_DOCTRINE_MISSING", "INDEPENDENCE_DOCTRINE_MISSING", "REPLAY_DOCTRINE_MISSING", "CERTIFICATION_DOCTRINE_MISSING", "TRUST_VOCABULARY_MISSING", "ENUMERATION_REGISTRY_MISSING", "CANONICAL_DEFINITIONS_MISSING", "TERMINOLOGY_NOT_FROZEN", "TRUST_EVENT_MODEL_MISSING", "EVENT_CATALOG_MISSING", "EVENT_REPLAY_SEMANTICS_MISSING", "EVENT_LINEAGE_MISSING", "EVENT_ORDERING_NOT_DETERMINISTIC", "HUMAN_OVERSIGHT_GOVERNANCE_MISSING", "CONSTITUTIONAL_PRECEDENCE_MISSING", "STAGE_TWO_NOT_ENABLED", "TRUST_AUTHORITY_CREATION_ATTEMPTED", "GOVERNANCE_BYPASS_ATTEMPTED", "NON_DETERMINISTIC_EVENT_MODEL"] as const satisfies readonly TrustFoundationStageOneFailure[];

describe("Stage 1 CATA Trust Foundation", () => {
  it("publishes the Stage 1 trust foundation doctrine", () => {
    const bundle = getTrustFoundationStageOneBundle();

    expect(bundle.doctrine).toMatchObject({ version: "trust-foundation-stage-one/stage-1", owns_cata_trust_baseline: true, establishes_constitutional_authority: true, freezes_canonical_vocabulary: true, defines_stage_contracts: true, defines_deterministic_event_model: true, authorizes_stage_two: true, qualification_gate: "Stage 1 Trust Foundation Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("FOUNDATION_ESTABLISHED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes existing trust constitutional and architecture foundations", () => {
    const first = runTrustFoundationStageOne({ seed: "deterministic" });
    const second = runTrustFoundationStageOne({ seed: "deterministic" });

    expect(first.upstream_refs).toContain("trust-constitutional-foundation/v5.0");
    expect(first.upstream_refs).toContain("trust-architecture-alignment-foundation/v5.1");
    expect(first.enables).toEqual(["stage-2:trust-identity-domains", "stage-3:trust-contracts-restriction-policy", "stage-4:autonomy-classification", "stage-5:trust-evidence-confidence", "all-subsequent-cata-stages"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustFoundationStageOne(first).valid).toBe(true);
    expect(replayTrustFoundationStageOne()).toBe(true);
  });

  it("establishes trust constitution and architecture baselines", () => {
    const result = runTrustFoundationStageOne();

    expect(result.constitution).toMatchObject({ constitutional_principles: true, authority_hierarchy: true, constitutional_invariants: true, governance_supremacy: true, human_oversight_authority: true, deterministic_decision_requirements: true, explainability_requirements: true, evidence_requirements: true, fail_closed_rules: true, approved: true });
    expect(result.architecture.internal_services).toEqual(["EVALUATION", "REGISTRY", "EVIDENCE", "CERTIFICATION", "MONITORING", "EXPLAINABILITY", "GOVERNANCE", "FEDERATION", "ADMINISTRATION"]);
    expect(result.architecture).toMatchObject({ service_decomposition: true, external_integration_points: true, dependency_model: true, deployment_boundaries: true, multi_tenant_architecture: true, trust_processing_pipeline: true, constitutional_evaluation_flow: true });
  });

  it("freezes doctrine, vocabulary, and lifecycle terminology", () => {
    const result = runTrustFoundationStageOne();

    expect(result.doctrine).toMatchObject({ independent_evaluation: true, trust_separation: true, risk_independence: true, confidence_independence: true, alignment_independence: true, human_oversight: true, deterministic_replay: true, certification: true });
    expect(result.vocabulary.terminology).toContain("Trust Certification");
    expect(result.vocabulary).toMatchObject({ enumeration_registry: true, standard_identifiers: true, object_naming: true, lifecycle_terminology: true, governance_terminology: true, certification_terminology: true, frozen: true, versioned: true });
    expect(result.lifecycle.states).toEqual(["DRAFT", "DEFINED", "APPROVED", "ACTIVE", "UNDER_REVIEW", "SUSPENDED", "REVOKED", "RECOVERING", "ARCHIVED"]);
    expect(result.lifecycle).toMatchObject({ transition_rules: true, revocation_lifecycle: true, recovery_lifecycle: true, archival_lifecycle: true });
  });

  it("defines canonical APIs and versioned contracts", () => {
    const result = runTrustFoundationStageOne();

    expect(result.apis.service_areas).toHaveLength(9);
    expect(result.apis).toMatchObject({ evaluation_apis: true, registry_apis: true, evidence_apis: true, certification_apis: true, monitoring_apis: true, explainability_apis: true, governance_apis: true, federation_apis: true, administrative_apis: true, reviewed: true });
    expect(result.contracts).toMatchObject({ evaluation_contracts: true, evidence_contracts: true, registry_contracts: true, monitoring_contracts: true, explainability_contracts: true, governance_contracts: true, federation_contracts: true, certification_contracts: true, event_contracts: true, versioned: true, validated: true });
  });

  it("publishes deterministic trust event model and governance authority matrix", () => {
    const result = runTrustFoundationStageOne();

    expect(result.events).toMatchObject({ taxonomy: true, identifiers: true, schema: true, lineage: true, ordering: true, replay_semantics: true, correlation_identifiers: true, versioning: true, audit_events: true, governance_events: true, deterministic: true });
    expect(result.governance).toMatchObject({ governance_authority: true, decision_ownership: true, constitutional_precedence: true, change_governance: true, policy_governance: true, version_governance: true, contract_governance: true, exception_governance: true, human_oversight_governance: true, certification_governance: true, authority_matrix: true });
  });

  it("authorizes Stage 2 only when all downstream dependencies are baselined", () => {
    const result = runTrustFoundationStageOne();

    expect(result.readiness).toMatchObject({ decision: "FOUNDATION_ESTABLISHED", downstream_dependencies_baselined: true, stage_two_authorized: true, deterministic_event_model: true, constitutional_authority_preserved: true, governance_supremacy_preserved: true, human_oversight_preserved: true, tenant_integration_ready: true });
  });

  it.each(conditionalFailures)("degrades to conditional establishment for %s", (failure) => {
    const result = runTrustFoundationStageOne({ scenario: failure });
    const validation = validateTrustFoundationStageOne(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_ESTABLISHED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_ESTABLISHED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runTrustFoundationStageOne({ scenario: failure });
    const validation = validateTrustFoundationStageOne(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observations, follow-up, and missing downstream baseline", () => {
    const observed = runTrustFoundationStageOne({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runTrustFoundationStageOne({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notEstablished = runTrustFoundationStageOne({ scenario: "DOWNSTREAM_DEPENDENCIES_NOT_BASELINED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_ESTABLISHED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_ESTABLISHED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notEstablished.readiness.decision).toBe("NOT_ESTABLISHED");
    expect(notEstablished.readiness.stage_two_authorized).toBe(false);
    expect(validateTrustFoundationStageOne(notEstablished).valid).toBe(false);
  });
});
