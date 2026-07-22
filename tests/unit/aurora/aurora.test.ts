import { describe, expect, it } from "vitest";
import { getAuroraBundle, replayAurora, runAurora, validateAurora } from "@/services/aurora";
import type { AuroraScenario } from "@/types/aurora";

describe("Program 4 P4.15 Aurora", () => {
  it("publishes Aurora doctrine without owning shared governance, infrastructure, or platform lifecycle", () => {
    const bundle = getAuroraBundle();

    expect(bundle.doctrine.version).toBe("aurora/v4.15");
    expect(bundle.doctrine.owns_application_logic).toBe(true);
    expect(bundle.doctrine.owns_domain_services).toBe(true);
    expect(bundle.doctrine.owns_user_experience).toBe(true);
    expect(bundle.doctrine.owns_application_apis).toBe(true);
    expect(bundle.doctrine.owns_application_automation).toBe(true);
    expect(bundle.doctrine.owns_constitutional_governance).toBe(false);
    expect(bundle.doctrine.owns_authority_enforcement).toBe(false);
    expect(bundle.doctrine.owns_policy_enforcement).toBe(false);
    expect(bundle.doctrine.owns_safety_enforcement).toBe(false);
    expect(bundle.doctrine.owns_evidence_storage).toBe(false);
    expect(bundle.doctrine.owns_replay_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_identity_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_certification_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_registry_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_observability_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_platform_lifecycle).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds deterministic Aurora application records across foundation, domain, UX, workflows, integration, security, and readiness", () => {
    const first = runAurora();
    const second = runAurora();

    expect(first.publisher_os_ref).toBe("publisher-os/v4.14");
    expect(first.pbg_ref).toBe("policy-business-governance/v4.13");
    expect(first.qci_ref).toBe("quantedge-compintel/v4.12");
    expect(first.mission_control_ref).toBe("mission-control/v4.11");
    expect(first.foundation.application_name).toBe("Aurora");
    expect(first.foundation.constitutional_inheritance_ref).toBe("application-governance-binding/v4.8");
    expect(first.domain_services.operational).toBe(true);
    expect(first.user_experience.operational).toBe(true);
    expect(first.workflow_engine.operational).toBe(true);
    expect(first.integration_layer.refs).toEqual(["cci", "caf", "mission-control", "qci", "pbg", "publisher-os"]);
    expect(first.governance.authority_inheritance_verified).toBe(true);
    expect(first.governance.enforcement_owned).toBe(false);
    expect(first.evidence.references_canonical_cci_evidence).toBe(true);
    expect(first.evidence.owns_evidence_storage).toBe(false);
    expect(first.security.tenant_isolation_validated).toBe(true);
    expect(first.readiness.application_certification_ref).toBe("certification:aurora:application");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateAurora(first).valid).toBe(true);
    expect(replayAurora(first)).toBe(true);
  });

  it("certifies Aurora exit criteria", () => {
    const result = runAurora();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.architecture_complete).toBe(true);
    expect(result.certification.domain_services_operational).toBe(true);
    expect(result.certification.workflows_execute_successfully).toBe(true);
    expect(result.certification.governance_integration_passes).toBe(true);
    expect(result.certification.authority_inheritance_verified).toBe(true);
    expect(result.certification.policy_validation_verified).toBe(true);
    expect(result.certification.safety_validation_verified).toBe(true);
    expect(result.certification.tenant_isolation_validated).toBe(true);
    expect(result.certification.replay_compatibility_validated).toBe(true);
    expect(result.certification.evidence_generation_complete).toBe(true);
    expect(result.certification.observability_operational).toBe(true);
    expect(result.certification.interoperability_verified).toBe(true);
    expect(result.certification.documentation_complete).toBe(true);
    expect(result.certification.production_readiness_approved).toBe(true);
    expect(result.certification.application_certification_complete).toBe(true);
    expect(result.certification.no_out_of_scope_ownership).toBe(true);
  });

  it.each([
    "P4_14_PUBLISHER_OS_INVALID",
    "P4_13_PBG_INVALID",
    "P4_12_QCI_INVALID",
    "P4_11_MISSION_CONTROL_INVALID",
    "PROGRAM_1_FOUNDATION_INVALID",
    "PROGRAM_2_CCI_INVALID",
    "PROGRAM_3_CAF_INVALID",
    "AURORA_APPLICATION_MISSING",
    "AURORA_ARCHITECTURE_MISSING",
    "MODULE_REGISTRY_MISSING",
    "SERVICE_CONTRACTS_MISSING",
    "DEPENDENCY_GRAPH_MISSING",
    "CONSTITUTIONAL_INHERITANCE_MISSING",
    "DOMAIN_SERVICES_MISSING",
    "DOMAIN_WORKFLOWS_MISSING",
    "ORCHESTRATION_LOGIC_MISSING",
    "SERVICE_VALIDATION_MISSING",
    "USER_EXPERIENCE_MISSING",
    "DASHBOARDS_MISSING",
    "ACCESSIBILITY_INVALID",
    "WORKFLOW_ENGINE_MISSING",
    "WORKFLOW_EXECUTION_FAILED",
    "APPROVAL_INTEGRATION_MISSING",
    "INTEGRATION_LAYER_MISSING",
    "ECOSYSTEM_INTEGRATIONS_INVALID",
    "GOVERNANCE_INTEGRATION_MISSING",
    "AUTHORITY_INHERITANCE_INVALID",
    "POLICY_VALIDATION_INVALID",
    "SAFETY_VALIDATION_INVALID",
    "EVIDENCE_INTEGRATION_MISSING",
    "CANONICAL_EVIDENCE_REFS_MISSING",
    "REPLAY_REFERENCES_MISSING",
    "OBSERVABILITY_MISSING",
    "APPLICATION_INTELLIGENCE_MISSING",
    "API_SUITE_MISSING",
    "INTERFACE_GOVERNANCE_INVALID",
    "VERSION_COMPATIBILITY_INVALID",
    "AUTOMATION_SERVICES_MISSING",
    "AUTOMATION_GOVERNANCE_INVALID",
    "TENANT_ISOLATION_INVALID",
    "SECURITY_CONFIGURATION_MISSING",
    "VALIDATION_REPORTS_MISSING",
    "DOCUMENTATION_MISSING",
    "PRODUCTION_READINESS_MISSING",
    "APPLICATION_CERTIFICATION_FAILED",
    "CONSTITUTIONAL_GOVERNANCE_OWNERSHIP_ATTEMPTED",
    "AUTHORITY_ENFORCEMENT_ATTEMPTED",
    "POLICY_ENFORCEMENT_ATTEMPTED",
    "SAFETY_ENFORCEMENT_ATTEMPTED",
    "EVIDENCE_STORAGE_ATTEMPTED",
    "REPLAY_INFRASTRUCTURE_ATTEMPTED",
    "IDENTITY_INFRASTRUCTURE_ATTEMPTED",
    "CERTIFICATION_INFRASTRUCTURE_ATTEMPTED",
    "REGISTRY_INFRASTRUCTURE_ATTEMPTED",
    "OBSERVABILITY_INFRASTRUCTURE_ATTEMPTED",
    "PLATFORM_LIFECYCLE_ATTEMPTED",
  ] as const)("fails Aurora certification for %s", (scenario: AuroraScenario) => {
    const result = runAurora({ scenario });
    const validation = validateAurora(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runAurora({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
