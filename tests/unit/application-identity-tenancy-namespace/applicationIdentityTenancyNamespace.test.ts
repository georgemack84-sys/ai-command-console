import { describe, expect, it } from "vitest";
import {
  getApplicationIdentityTenancyNamespaceBundle,
  replayApplicationIdentityTenancyNamespace,
  runApplicationIdentityTenancyNamespace,
  validateApplicationIdentityTenancyNamespace,
} from "@/services/application-identity-tenancy-namespace";
import type { ApplicationIdentityScenario } from "@/types/application-identity-tenancy-namespace";

describe("Program 4 P4.4 Application Identity, Tenancy and Namespace", () => {
  it("publishes identity doctrine without owning lifecycle, composition, deployment, runtime, messaging, or governance execution", () => {
    const bundle = getApplicationIdentityTenancyNamespaceBundle();

    expect(bundle.doctrine.version).toBe("application-identity-tenancy-namespace/v4.4");
    expect(bundle.doctrine.owns_application_identities).toBe(true);
    expect(bundle.doctrine.owns_namespaces).toBe(true);
    expect(bundle.doctrine.owns_application_ownership).toBe(true);
    expect(bundle.doctrine.owns_tenant_integration_boundaries).toBe(true);
    expect(bundle.doctrine.implements_application_lifecycle).toBe(false);
    expect(bundle.doctrine.owns_capability_composition).toBe(false);
    expect(bundle.doctrine.performs_deployment).toBe(false);
    expect(bundle.doctrine.owns_runtime).toBe(false);
    expect(bundle.doctrine.owns_messaging).toBe(false);
    expect(bundle.doctrine.executes_governance).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("establishes deterministic immutable application identity, namespace, ownership, and tenant binding", () => {
    const first = runApplicationIdentityTenancyNamespace();
    const second = runApplicationIdentityTenancyNamespace();

    expect(first.application_capability_composition_ref).toBe("application-capability-composition/v4.3");
    expect(first.identity_record.application_id).toBe("civitas.app.ops.command-console");
    expect(first.identity_record.immutable).toBe(true);
    expect(first.identity_record.globally_unique).toBe(true);
    expect(first.namespace_record.allocation_status).toBe("ALLOCATED");
    expect(first.namespace_record.reservation_status).toBe("RESERVED");
    expect(first.ownership_record.registered).toBe(true);
    expect(first.tenant_integration.qualification_status).toBe("QUALIFIED");
    expect(first.certification.outcome).toBe("PASS");
    expect(first.certification.phase_ready).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateApplicationIdentityTenancyNamespace(first).valid).toBe(true);
    expect(replayApplicationIdentityTenancyNamespace(first)).toBe(true);
  });

  it("enforces lifecycle sequencing, tenant isolation, registry synchronization, and immutable evidence", () => {
    const result = runApplicationIdentityTenancyNamespace();

    expect(result.identity_lifecycle.at(0)).toBe("IDENTITY_REQUESTED");
    expect(result.identity_lifecycle).toContain("TENANT_BOUND");
    expect(result.tenant_integration.boundary_validation_status).toBe("PASS");
    expect(result.tenant_integration.isolation_enforced).toBe(true);
    expect(result.tenant_integration.contract_validated).toBe(true);
    expect(result.registry_synchronization.cci_identity_sync).toBe(true);
    expect(result.registry_synchronization.cci_namespace_sync).toBe(true);
    expect(result.registry_synchronization.caf_identity_sync).toBe(true);
    expect(result.registry_synchronization.tqf_contract_sync).toBe(true);
    expect(result.evidence.complete).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.lineage_refs).toHaveLength(3);
  });

  it.each([
    "P4_3_COMPOSITION_INVALID",
    "CCI_IDENTITY_INFRASTRUCTURE_INVALID",
    "CCI_NAMESPACE_REGISTRY_INVALID",
    "CAF_IDENTITY_SERVICES_INVALID",
    "TQF_TENANT_CONTRACT_INVALID",
    "APPLICATION_ID_MISSING",
    "APPLICATION_ID_NOT_UNIQUE",
    "APPLICATION_ID_MUTABLE",
    "IDENTITY_LINEAGE_INCOMPLETE",
    "IDENTITY_INTEGRITY_FAILED",
    "NAMESPACE_NOT_ALLOCATED",
    "NAMESPACE_COLLISION_DETECTED",
    "NAMESPACE_NOT_RESERVED",
    "NAMESPACE_INHERITANCE_INVALID",
    "NAMESPACE_RETIREMENT_MISSING",
    "OWNERSHIP_NOT_REGISTERED",
    "CONSTITUTIONAL_OWNER_MISSING",
    "OPERATIONAL_OWNER_MISSING",
    "OWNERSHIP_TRANSFER_UNGOVERNED",
    "OWNERSHIP_LINEAGE_INCOMPLETE",
    "TENANT_NOT_BOUND",
    "TENANT_ISOLATION_FAILED",
    "TENANT_BOUNDARY_INVALID",
    "TENANT_QUALIFICATION_UNVERIFIED",
    "TENANT_NAMESPACE_BINDING_INVALID",
    "TENANT_CONTRACT_VALIDATION_FAILED",
    "IDENTITY_VALIDATION_FAILED",
    "REGISTRY_SYNCHRONIZATION_FAILED",
    "AUDIT_EVIDENCE_MISSING",
    "AUDIT_EVIDENCE_MUTABLE",
    "APPLICATION_LIFECYCLE_IMPLEMENTED",
    "DEPLOYMENT_ATTEMPTED",
    "RUNTIME_ATTEMPTED",
    "MESSAGING_ATTEMPTED",
    "GOVERNANCE_EXECUTION_ATTEMPTED",
  ] as const)("fails identity certification for %s", (scenario: ApplicationIdentityScenario) => {
    const result = runApplicationIdentityTenancyNamespace({ scenario });
    const validation = validateApplicationIdentityTenancyNamespace(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runApplicationIdentityTenancyNamespace({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
