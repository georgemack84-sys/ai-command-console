import { describe, expect, it } from "vitest";
import {
  getTenantProvisioningLifecycleBundle,
  replayTenantProvisioningLifecycle,
  runTenantProvisioningLifecycle,
  validateTenantProvisioningLifecycle,
} from "@/services/tenant-provisioning-lifecycle";
import type { TenantProvisioningLifecycleFailure } from "@/types/tenant-provisioning-lifecycle";

describe("Mission Control Phase 17.2 Tenant Provisioning & Lifecycle", () => {
  it("publishes tenant provisioning lifecycle doctrine", () => {
    const bundle = getTenantProvisioningLifecycleBundle();

    expect(bundle.doctrine.version).toBe("tenant-provisioning-lifecycle/v17.2");
    expect(bundle.doctrine.upstream_phase).toBe("multi-tenant-production-foundation/v17.1");
    expect(bundle.doctrine.lifecycle_states).toEqual(["REQUESTED", "PROVISIONING", "CONFIGURED", "QUALIFIED", "ACTIVE", "SUSPENDED", "ARCHIVED", "RETIRED"]);
    expect(bundle.doctrine.transition_outcomes).toHaveLength(9);
    expect(bundle.validation.valid).toBe(true);
  });

  it("provisions a tenant deterministically", () => {
    const result = runTenantProvisioningLifecycle();

    expect(result.provisioning_engine.provisioning_steps).toHaveLength(10);
    expect(result.provisioning_engine.deterministic).toBe(true);
    expect(result.provisioning_engine.tenant_identity_created).toBe(true);
    expect(result.provisioning_engine.certification_registered).toBe(true);
  });

  it("configures and qualifies the tenant before activation", () => {
    const result = runTenantProvisioningLifecycle();

    expect(result.configuration_service.validated).toBe(true);
    expect(result.qualification_service.qualified).toBe(true);
    expect(result.qualification_service.certification_prerequisites_satisfied).toBe(true);
    expect(result.transition_validation.active_requires_qualification).toBe(true);
  });

  it("records the complete tenant lifecycle with unique vocabulary", () => {
    const result = runTenantProvisioningLifecycle();

    expect(result.lifecycle_records).toHaveLength(8);
    expect(result.lifecycle_records.map((record) => record.current_state)).toEqual(["REQUESTED", "PROVISIONING", "CONFIGURED", "QUALIFIED", "ACTIVE", "SUSPENDED", "ARCHIVED", "RETIRED"]);
    expect(result.lifecycle_registry.current_state).toBe("RETIRED");
    expect(result.lifecycle_registry.historical_records_preserved).toBe(true);
  });

  it("validates transition rules and supported outcomes", () => {
    const result = runTenantProvisioningLifecycle();

    expect(result.transition_validation.transition_outcomes).toEqual(["TRANSITION_COMPLETED", "TRANSITION_REJECTED", "INVALID_TRANSITION", "QUALIFICATION_REQUIRED", "AUTHORIZATION_REQUIRED", "GOVERNANCE_REVIEW_REQUIRED", "POLICY_VIOLATION", "CERTIFICATION_REQUIRED", "INTEGRITY_FAILURE"]);
    expect(result.transition_validation.governance_authorization).toBe(true);
    expect(result.transition_validation.invalid_transitions_rejected).toBe(true);
  });

  it("preserves replay and immutable audit history", () => {
    const result = runTenantProvisioningLifecycle();

    expect(result.replay_service.reconstructs_state_transitions).toBe(true);
    expect(result.replay_service.reconstructs_qualification).toBe(true);
    expect(result.audit_ledger.entries).toHaveLength(8);
    expect(result.audit_ledger.entries.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable)).toBe(true);
  });

  it("publishes lifecycle observability and certification evidence", () => {
    const result = runTenantProvisioningLifecycle();

    expect(result.dashboard.operational).toBe(true);
    expect(result.dashboard.certification_readiness_visible).toBe(true);
    expect(result.certification_package.provisioning_certified).toBe(true);
    expect(result.certification_package.tenant_isolation_maintained).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runTenantProvisioningLifecycle();
    const second = runTenantProvisioningLifecycle();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTenantProvisioningLifecycle(first).valid).toBe(true);
    expect(replayTenantProvisioningLifecycle(first)).toBe(true);
  });

  it("executes the Phase 17.2 tenant lifecycle certification matrix", () => {
    const result = runTenantProvisioningLifecycle();

    expect(result.certification_tests).toHaveLength(14);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
  }, 300000);

  it("supports conditional pass for non-constitutional lifecycle warnings", () => {
    const result = runTenantProvisioningLifecycle({ scenario: "NON_CONSTITUTIONAL_LIFECYCLE_WARNING" });
    const validation = validateTenantProvisioningLifecycle(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.certification_package.provisioning_certified).toBe(true);
    expect(validation.valid).toBe(false);
  });

  it.each([
    "PROVISIONING_NOT_DETERMINISTIC",
    "TENANT_LIFECYCLE_VOCABULARY_NOT_UNIQUE",
    "LIFECYCLE_NOT_REPRODUCIBLE",
    "LIFECYCLE_AUDIT_INCOMPLETE",
    "TENANT_QUALIFICATION_NOT_VALIDATED",
    "GOVERNANCE_AUTHORIZATION_NOT_ENFORCED",
    "REPLAY_VALIDATION_INCOMPLETE",
    "LIFECYCLE_HISTORY_MUTABLE",
    "TENANT_ISOLATION_NOT_MAINTAINED",
    "PROVISIONING_NOT_CERTIFIED",
    "INVALID_TRANSITIONS_NOT_REJECTED",
    "ACTIVE_WITHOUT_QUALIFICATION_ALLOWED",
    "RETIREMENT_HISTORY_NOT_PRESERVED",
    "PHASE_17_1_FOUNDATION_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: TenantProvisioningLifecycleFailure) => {
    const result = runTenantProvisioningLifecycle({ scenario });
    const validation = validateTenantProvisioningLifecycle(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested lifecycle record tampering", () => {
    const result = runTenantProvisioningLifecycle();
    const tampered = {
      ...result,
      lifecycle_records: result.lifecycle_records.map((record, index) => index === 4 ? { ...record, current_state: "RETIRED" as const } : record),
    };

    expect(validateTenantProvisioningLifecycle(tampered).valid).toBe(false);
  });
});
