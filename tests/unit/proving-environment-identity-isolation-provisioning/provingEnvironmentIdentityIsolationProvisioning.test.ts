import { describe, expect, it } from "vitest";
import { getProvingEnvironmentIdentityIsolationProvisioningBundle, replayProvingEnvironmentIdentityIsolationProvisioning, runProvingEnvironmentIdentityIsolationProvisioning, validateProvingEnvironmentIdentityIsolationProvisioning } from "@/services/proving-environment-identity-isolation-provisioning";
import type { ProvingProvisioningFailure } from "@/types/proving-environment-identity-isolation-provisioning";

const FAILURE_MATRIX: readonly ProvingProvisioningFailure[] = [
  "P6_1_FOUNDATION_INVALID",
  "ENVIRONMENT_IDENTITY_MISSING",
  "GLOBAL_ID_NOT_UNIQUE",
  "IMMUTABLE_IDENTITY_VIOLATION",
  "ENVIRONMENT_OWNERSHIP_MISSING",
  "ENVIRONMENT_CLASSIFICATION_MISSING",
  "ENVIRONMENT_REGISTRY_MISSING",
  "ENVIRONMENT_REGISTRY_INCOMPLETE",
  "IDENTITY_REGISTRY_MISSING",
  "IDENTITY_LINEAGE_INCOMPLETE",
  "TENANT_ISOLATION_FAILURE",
  "MULTI_TENANT_BINDING_DETECTED",
  "TENANT_BOUNDARY_CROSSED",
  "NAMESPACE_ISOLATION_FAILURE",
  "NAMESPACE_NOT_UNIQUE",
  "NAMESPACE_MUTATED",
  "PROVISIONING_PIPELINE_MISSING",
  "PROVISIONING_NONDETERMINISTIC",
  "TRUST_DOMAIN_BINDING_MISSING",
  "POLICY_ATTACHMENT_MISSING",
  "SERVICE_DEPLOYMENT_MISSING",
  "STORAGE_ALLOCATION_MISSING",
  "EVENT_REGISTRATION_MISSING",
  "AUDIT_INITIALIZATION_MISSING",
  "LIFECYCLE_MODEL_MISSING",
  "LIFECYCLE_TRANSITION_UNGOVERNED",
  "LIFECYCLE_AUDIT_EVIDENCE_MISSING",
  "RETIREMENT_MODEL_MISSING",
  "RETIRED_ENVIRONMENT_REACTIVATED",
  "IDENTITY_REUSED_AFTER_RETIREMENT",
  "EVIDENCE_PRESERVATION_MISSING",
  "ARCHIVAL_NOT_IMMUTABLE",
  "LINEAGE_MISSING",
  "LINEAGE_OVERWRITE_DETECTED",
  "REPLAY_IDENTITY_REFERENCE_MUTABLE",
  "CONFIGURATION_NOT_REPRODUCIBLE",
  "ISOLATION_POLICY_VIOLATION_NOT_FAIL_CLOSED",
  "PLATFORM_IDENTITY_OWNERSHIP_VIOLATION",
  "DEPLOYMENT_INFRASTRUCTURE_OWNERSHIP_VIOLATION",
  "RUNTIME_ORCHESTRATION_OWNERSHIP_VIOLATION",
  "PROVING_EXECUTION_OWNERSHIP_VIOLATION",
  "VALIDATION_LOGIC_OWNERSHIP_VIOLATION",
  "CERTIFICATION_OWNERSHIP_VIOLATION",
  "TRUST_DECISION_OWNERSHIP_VIOLATION",
  "P6_2_VERIFY_001_FAILED",
];

describe("P6.2 Proving Environment Identity, Isolation, and Provisioning", () => {
  it("publishes ownership doctrine while excluding execution, validation, certification, platform identity, and orchestration", () => {
    const bundle = getProvingEnvironmentIdentityIsolationProvisioningBundle();

    expect(bundle.doctrine.version).toBe("proving-environment-identity-isolation-provisioning/v6.2");
    expect(bundle.doctrine.owns_proving_identities).toBe(true);
    expect(bundle.doctrine.owns_environment_identities).toBe(true);
    expect(bundle.doctrine.owns_tenant_isolation).toBe(true);
    expect(bundle.doctrine.owns_environment_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_environment_registry).toBe(true);
    expect(bundle.doctrine.owns_proving_execution).toBe(false);
    expect(bundle.doctrine.owns_validation_logic).toBe(false);
    expect(bundle.doctrine.owns_certification).toBe(false);
    expect(bundle.doctrine.owns_trust_decisions).toBe(false);
    expect(bundle.doctrine.owns_deployment_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_platform_identity).toBe(false);
    expect(bundle.doctrine.owns_runtime_orchestration).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic immutable environment identity, registries, provisioning, lifecycle, and lineage", () => {
    const first = runProvingEnvironmentIdentityIsolationProvisioning();
    const second = runProvingEnvironmentIdentityIsolationProvisioning();

    expect(first.phase_identifier).toBe("ProvingEnvironmentIdentityIsolationProvisioning");
    expect(first.foundation_ref).toBe("proving-architecture-environment-foundation/v6.1");
    expect(first.environment_identity.environment_id).toBe("proving-env:civitas:p6.2:identity");
    expect(first.environment_identity.globally_unique).toBe(true);
    expect(first.environment_identity.immutable).toBe(true);
    expect(first.environment_identity.tenant_id).toBe("tenant:civitas:proving");
    expect(first.environment_identity.namespace).toBe("ns:civitas:proving:p6-2");
    expect(first.environment_registry.complete).toBe(true);
    expect(first.environment_registry.immutable_except_lifecycle_progression).toBe(true);
    expect(first.identity_registry.complete_lineage).toBe(true);
    expect(first.provisioning_pipeline.deterministic).toBe(true);
    expect(first.provisioning_pipeline.repeatable).toBe(true);
    expect(first.lineage.immutable).toBe(true);
    expect(first.lineage.overwrite_prevented).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingEnvironmentIdentityIsolationProvisioning(first).valid).toBe(true);
    expect(replayProvingEnvironmentIdentityIsolationProvisioning(first)).toBe(true);
  });

  it("enforces tenant, namespace, identity, storage, network, evidence, replay, and policy isolation", () => {
    const result = runProvingEnvironmentIdentityIsolationProvisioning();

    expect(result.isolation_policy.tenant).toBe(true);
    expect(result.isolation_policy.namespace).toBe(true);
    expect(result.isolation_policy.identity).toBe(true);
    expect(result.isolation_policy.storage).toBe(true);
    expect(result.isolation_policy.network).toBe(true);
    expect(result.isolation_policy.compute).toBe(true);
    expect(result.isolation_policy.execution).toBe(true);
    expect(result.isolation_policy.secrets).toBe(true);
    expect(result.isolation_policy.configuration).toBe(true);
    expect(result.isolation_policy.messaging).toBe(true);
    expect(result.isolation_policy.telemetry).toBe(true);
    expect(result.isolation_policy.evidence).toBe(true);
    expect(result.isolation_policy.audit).toBe(true);
    expect(result.isolation_policy.replay).toBe(true);
    expect(result.isolation_policy.policies).toBe(true);
    expect(result.isolation_policy.fail_closed).toBe(true);
    expect(result.isolation_policy.tenant_sharing_prohibited_until_federation).toBe(true);
  });

  it("formalizes lifecycle, retirement, invariants, and P6.2 verification gate", () => {
    const result = runProvingEnvironmentIdentityIsolationProvisioning();

    expect(result.lifecycle.states).toEqual(["REQUESTED", "PROVISIONING", "INITIALIZING", "VALIDATING", "READY", "ACTIVE", "SUSPENDED", "RETIRING", "ARCHIVED"]);
    expect(result.lifecycle.governed_progression).toBe(true);
    expect(result.lifecycle.transition_audit_evidence).toHaveLength(9);
    expect(result.retirement.evidence_preservation).toBe(true);
    expect(result.retirement.immutable_archival).toBe(true);
    expect(result.retirement.identity_reuse_prevented).toBe(true);
    expect(result.retirement.reactivation_prevented).toBe(true);
    expect(result.invariants).toHaveLength(12);
    expect(result.invariants.every((item) => item.satisfied)).toBe(true);
    expect(result.verification.verification_id).toBe("P6.2-VERIFY-001");
    expect(result.verification.passed).toBe(true);
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it("registers every proving identity kind with traceable lineage", () => {
    const result = runProvingEnvironmentIdentityIsolationProvisioning();

    expect(result.identity_registry.environment_identities[0]?.identity_kind).toBe("ENVIRONMENT");
    expect(result.identity_registry.execution_identities[0]?.identity_kind).toBe("EXECUTION");
    expect(result.identity_registry.service_identities[0]?.identity_kind).toBe("SERVICE");
    expect(result.identity_registry.operator_identities[0]?.identity_kind).toBe("OPERATOR");
    expect(result.identity_registry.automation_identities[0]?.identity_kind).toBe("AUTOMATION");
    expect(result.identity_registry.workload_identities[0]?.identity_kind).toBe("WORKLOAD");
    expect([
      ...result.identity_registry.environment_identities,
      ...result.identity_registry.execution_identities,
      ...result.identity_registry.service_identities,
      ...result.identity_registry.operator_identities,
      ...result.identity_registry.automation_identities,
      ...result.identity_registry.workload_identities,
    ].every((identity) => identity.traceable && identity.immutable && identity.lineage_ref.length > 0)).toBe(true);
  });

  it.each(FAILURE_MATRIX)("fails provisioning readiness for %s", (failure) => {
    const result = runProvingEnvironmentIdentityIsolationProvisioning({ scenario: failure });
    const validation = validateProvingEnvironmentIdentityIsolationProvisioning(result);

    expect(result.readiness.outcome).toBe("FAIL");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance-review-required without provisioning readiness", () => {
    const result = runProvingEnvironmentIdentityIsolationProvisioning({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.readiness.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
  });
});
