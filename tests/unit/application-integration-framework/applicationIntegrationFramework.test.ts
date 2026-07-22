import { describe, expect, it } from "vitest";
import {
  getApplicationIntegrationFrameworkBundle,
  replayApplicationIntegrationFramework,
  runApplicationIntegrationFramework,
  validateApplicationIntegrationFramework,
} from "@/services/application-integration-framework";
import type { ApplicationIntegrationScenario } from "@/types/application-integration-framework";

describe("Program 4 P4.6 Application Integration Framework", () => {
  it("publishes integration doctrine without building, executing, deploying, or bypassing governance", () => {
    const bundle = getApplicationIntegrationFrameworkBundle();

    expect(bundle.doctrine.version).toBe("application-integration-framework/v4.6");
    expect(bundle.doctrine.owns_cci_integration).toBe(true);
    expect(bundle.doctrine.owns_caf_integration).toBe(true);
    expect(bundle.doctrine.owns_interface_governance).toBe(true);
    expect(bundle.doctrine.owns_application_interoperability_contracts).toBe(true);
    expect(bundle.doctrine.builds_applications).toBe(false);
    expect(bundle.doctrine.executes_applications).toBe(false);
    expect(bundle.doctrine.deploys_applications).toBe(false);
    expect(bundle.doctrine.bypasses_constitutional_governance).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("establishes deterministic contract-driven application integration", () => {
    const first = runApplicationIntegrationFramework();
    const second = runApplicationIntegrationFramework();

    expect(first.application_identity_ref).toBe("application-identity-tenancy-namespace/v4.4");
    expect(first.application_certification_ref).toBe("application-lifecycle-certification/v4.5");
    expect(first.integration_contract.versioned).toBe(true);
    expect(first.integration_contract.contract_driven).toBe(true);
    expect(first.interface_record.lifecycle_status).toBe("ACTIVE");
    expect(first.integration_record.validation_result).toBe("VALIDATED");
    expect(first.certification.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateApplicationIntegrationFramework(first).valid).toBe(true);
    expect(replayApplicationIntegrationFramework(first)).toBe(true);
  });

  it("validates gateway, CCI, CAF, interoperability, governance, tenant isolation, and evidence", () => {
    const result = runApplicationIntegrationFramework();

    expect(result.application_gateway.operational).toBe(true);
    expect(result.application_gateway.authentication).toBe(true);
    expect(result.application_gateway.authorization).toBe(true);
    expect(result.cci_adapter.validated).toBe(true);
    expect(result.caf_adapter.validated).toBe(true);
    expect(result.interface_record.compatibility_status).toBe("COMPATIBLE");
    expect(result.interface_governance.breaking_change_governance).toBe(true);
    expect(result.interface_governance.constitutional_compliance).toBe(true);
    expect(result.integration_record.tenant_scope.length).toBeGreaterThan(0);
    expect(result.evidence.complete).toBe(true);
    expect(result.evidence.immutable).toBe(true);
  });

  it.each([
    "P4_4_IDENTITY_INVALID",
    "P4_5_CERTIFICATION_INVALID",
    "PROGRAM_1_STANDARDS_INVALID",
    "PROGRAM_1_CAPABILITY_ATLAS_INVALID",
    "PROGRAM_1_TERMINOLOGY_INVALID",
    "CCI_INTEGRATION_INVALID",
    "CAF_INTEGRATION_INVALID",
    "CONTRACT_REGISTRY_MISSING",
    "CONTRACT_NOT_VERSIONED",
    "CONTRACT_LINEAGE_INCOMPLETE",
    "INTERFACE_NOT_REGISTERED",
    "INTERFACE_OWNER_MISSING",
    "INTERFACE_NAMESPACE_UNGOVERNED",
    "INTERFACE_VERSIONING_FAILED",
    "INTERFACE_COMPATIBILITY_NOT_VALIDATED",
    "BREAKING_CHANGE_UNGOVERNED",
    "APPLICATION_GATEWAY_UNAVAILABLE",
    "GATEWAY_AUTHENTICATION_MISSING",
    "GATEWAY_AUTHORIZATION_MISSING",
    "REQUEST_VALIDATION_MISSING",
    "TENANT_ISOLATION_BROKEN",
    "UNAUTHORIZED_PLATFORM_COUPLING",
    "INTEGRATION_NOT_CONTRACT_DRIVEN",
    "INTEROPERABILITY_CONTRACT_MISSING",
    "INTEROPERABILITY_VALIDATION_FAILED",
    "EVIDENCE_MISSING",
    "EVIDENCE_MUTABLE",
    "CONSTITUTIONAL_GOVERNANCE_BYPASSED",
  ] as const)("fails integration certification for %s", (scenario: ApplicationIntegrationScenario) => {
    const result = runApplicationIntegrationFramework({ scenario });
    const validation = validateApplicationIntegrationFramework(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runApplicationIntegrationFramework({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
