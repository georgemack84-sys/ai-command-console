import { describe, expect, it } from "vitest";
import { getApplicationFactoryBundle, replayApplicationFactory, runApplicationFactory, validateApplicationFactory } from "@/services/application-factory";
import type { ApplicationFactoryScenario } from "@/types/application-factory";

describe("Program 4 P4.18 Application Factory", () => {
  it("publishes factory doctrine without claiming platform or governance infrastructure", () => {
    const bundle = getApplicationFactoryBundle();

    expect(bundle.doctrine.version).toBe("application-factory/v4.18");
    expect(bundle.doctrine.owns_application_templates).toBe(true);
    expect(bundle.doctrine.owns_application_bootstrapping).toBe(true);
    expect(bundle.doctrine.owns_reusable_architectures).toBe(true);
    expect(bundle.doctrine.owns_application_promotion).toBe(true);
    expect(bundle.doctrine.owns_platform_architecture).toBe(false);
    expect(bundle.doctrine.owns_governance_engines).toBe(false);
    expect(bundle.doctrine.owns_registry_engine).toBe(false);
    expect(bundle.doctrine.owns_certification_engine).toBe(false);
    expect(bundle.doctrine.owns_replay_engine).toBe(false);
    expect(bundle.doctrine.owns_evidence_storage).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("deterministically generates an application bootstrap from approved templates and blueprints", () => {
    const first = runApplicationFactory({ application_slug: "risk-console" });
    const second = runApplicationFactory({ application_slug: "risk-console" });

    expect(first.phase_identifier).toBe("ApplicationFactory");
    expect(first.stevn_ref).toBe("stevn-application/v4.17");
    expect(first.apex_ref).toBe("apex/v4.16");
    expect(first.templates.approved_template_refs).toContain("approval:template:standard-application");
    expect(first.templates.governed_versioning).toBe(true);
    expect(first.blueprints.approved_blueprint_refs).toContain("approval:blueprint:application-shell");
    expect(first.blueprints.composition_valid).toBe(true);
    expect(first.bootstrap.generated_application_id).toBe("app:risk-console");
    expect(first.bootstrap.generated_namespace).toBe("civitas.application.risk-console");
    expect(first.bootstrap.deterministic_bootstrap).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateApplicationFactory(first).valid).toBe(true);
    expect(replayApplicationFactory()).toBe(true);
  });

  it("automatically inherits Program 4 contracts and initializes ecosystem integrations", () => {
    const result = runApplicationFactory();

    expect(result.inheritance.constitutional_ref).toBe("application-constitutional-foundation/v4.1");
    expect(result.inheritance.governance_ref).toBe("application-governance-binding/v4.8");
    expect(result.inheritance.lifecycle_ref).toBe("application-lifecycle-certification/v4.5");
    expect(result.inheritance.complete).toBe(true);
    expect(result.integration.registry_ref).toBe("registry:application:generated-civitas-app");
    expect(result.integration.integration_contract_refs).toEqual(["contract:cci", "contract:caf", "contract:mission-control"]);
    expect(result.integration.evidence_ref).toBe("evidence:initialized");
    expect(result.integration.observability_ref).toBe("observability:initialized");
    expect(result.promotion.promotion_allowed).toBe(true);
    expect(result.governance.governed).toBe(true);
  });

  it("qualifies replay, observability, isolation, artifact integrity, and ecosystem interoperability", () => {
    const result = runApplicationFactory();

    expect(result.replay_evidence.replay_complete).toBe(true);
    expect(result.observability.observable).toBe(true);
    expect(result.observability.diagnostics_ref).toBe("diagnostics:factory");
    expect(result.security.secure).toBe(true);
    expect(result.security.tenant_isolation_ref).toBe("isolation:tenant");
    expect(result.security.artifact_integrity_ref).toBe("integrity:artifact");
    expect(result.qualification.constitutional_inheritance_valid).toBe(true);
    expect(result.qualification.deterministic_bootstrapping_valid).toBe(true);
    expect(result.qualification.template_governance_valid).toBe(true);
    expect(result.qualification.architecture_validation_valid).toBe(true);
    expect(result.qualification.promotion_governance_valid).toBe(true);
    expect(result.qualification.interoperability_valid).toBe(true);
    expect(result.qualification.qualified).toBe(true);
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
  });

  it.each([
    "P4_17_STEVN_INVALID",
    "P4_16_APEX_INVALID",
    "P4_15_AURORA_INVALID",
    "P4_14_PUBLISHER_OS_INVALID",
    "P4_13_PBG_INVALID",
    "P4_12_QCI_INVALID",
    "P4_11_MISSION_CONTROL_INVALID",
    "P4_10_OBSERVABILITY_INVALID",
    "P4_9_REPLAY_AUDIT_INVALID",
    "P4_8_GOVERNANCE_BINDING_INVALID",
    "P4_7_EVIDENCE_GOVERNANCE_INVALID",
    "P4_6_INTEGRATION_FRAMEWORK_INVALID",
    "P4_5_LIFECYCLE_CERTIFICATION_INVALID",
    "P4_4_IDENTITY_NAMESPACE_INVALID",
    "P4_3_CAPABILITY_MAPPING_INVALID",
    "P4_2_REGISTRY_CATALOG_INVALID",
    "P4_1_CONSTITUTION_INVALID",
    "FACTORY_ARCHITECTURE_MISSING",
    "GENERATION_PIPELINE_MISSING",
    "TEMPLATE_REGISTRY_MISSING",
    "TEMPLATE_NOT_APPROVED",
    "TEMPLATE_LINEAGE_MISSING",
    "BLUEPRINT_LIBRARY_MISSING",
    "BLUEPRINT_NOT_APPROVED",
    "COMPOSITION_INVALID",
    "BOOTSTRAP_ENGINE_MISSING",
    "BOOTSTRAP_NONDETERMINISTIC",
    "NAMESPACE_GENERATION_INVALID",
    "IDENTITY_INITIALIZATION_INVALID",
    "CAPABILITY_COMPOSITION_INVALID",
    "CONTRACT_GENERATION_MISSING",
    "CONSTITUTIONAL_INHERITANCE_MISSING",
    "GOVERNANCE_INHERITANCE_MISSING",
    "AUTHORITY_INHERITANCE_MISSING",
    "LIFECYCLE_INHERITANCE_MISSING",
    "REGISTRY_REGISTRATION_MISSING",
    "INTEGRATION_CONTRACTS_MISSING",
    "EVIDENCE_INITIALIZATION_MISSING",
    "OBSERVABILITY_INITIALIZATION_MISSING",
    "PROMOTION_PIPELINE_MISSING",
    "PROMOTION_APPROVAL_MISSING",
    "PROMOTION_READINESS_INVALID",
    "FACTORY_GOVERNANCE_MISSING",
    "FACTORY_AUDIT_MISSING",
    "REPLAY_EVIDENCE_MISSING",
    "REPLAY_NONDETERMINISTIC",
    "FACTORY_OBSERVABILITY_MISSING",
    "DIAGNOSTICS_MISSING",
    "TENANT_ISOLATION_INVALID",
    "ARTIFACT_INTEGRITY_INVALID",
    "PROMOTION_AUTHORIZATION_INVALID",
    "INTEROPERABILITY_INVALID",
    "QUALIFICATION_FAILED",
    "PLATFORM_ARCHITECTURE_OWNERSHIP_ATTEMPTED",
    "GOVERNANCE_ENGINE_OWNERSHIP_ATTEMPTED",
    "REGISTRY_ENGINE_OWNERSHIP_ATTEMPTED",
    "CERTIFICATION_ENGINE_OWNERSHIP_ATTEMPTED",
    "REPLAY_ENGINE_OWNERSHIP_ATTEMPTED",
    "EVIDENCE_STORAGE_OWNERSHIP_ATTEMPTED",
  ] as const)("fails Application Factory qualification for %s", (scenario: ApplicationFactoryScenario) => {
    const result = runApplicationFactory({ scenario });
    const validation = validateApplicationFactory(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runApplicationFactory({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
