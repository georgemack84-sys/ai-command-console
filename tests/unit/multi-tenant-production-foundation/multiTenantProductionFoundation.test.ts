import { describe, expect, it } from "vitest";
import {
  getMultiTenantProductionFoundationBundle,
  replayMultiTenantProductionFoundation,
  runMultiTenantProductionFoundation,
  validateMultiTenantProductionFoundation,
} from "@/services/multi-tenant-production-foundation";
import type { MultiTenantProductionFoundationFailure } from "@/types/multi-tenant-production-foundation";

describe("Mission Control Phase 17.1 Multi-Tenant Production Foundation", () => {
  it("publishes multi-tenant production foundation doctrine", () => {
    const bundle = getMultiTenantProductionFoundationBundle();

    expect(bundle.doctrine.version).toBe("multi-tenant-production-foundation/v17.1");
    expect(bundle.doctrine.upstream_phase).toBe("phase-16-certification-gate/v16.12");
    expect(bundle.doctrine.lifecycle_states).toEqual(["ARCHITECTURE_DEFINED", "CONTRACT_ESTABLISHED", "FOUNDATION_REGISTERED", "TENANT_SCALING_ENABLED", "CERTIFICATION_BOUNDARIES_ESTABLISHED", "FOUNDATION_CERTIFIED"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("establishes the production contract and constitutional invariants", () => {
    const result = runMultiTenantProductionFoundation();

    expect(result.contract.approved).toBe(true);
    expect(result.contract.ownership_domains).toHaveLength(7);
    expect(result.contract.tenant_responsibilities).toHaveLength(8);
    expect(result.contract.constitutional_invariants).toHaveLength(12);
    expect(result.contract.isolation_domains).toHaveLength(13);
  });

  it("progresses the deterministic production scaling lifecycle", () => {
    const result = runMultiTenantProductionFoundation();

    expect(result.lifecycle.states).toHaveLength(6);
    expect(result.lifecycle.current_state).toBe("FOUNDATION_CERTIFIED");
    expect(result.lifecycle.deterministic_progression).toBe(true);
    expect(result.lifecycle.replay_reconstructable).toBe(true);
  });

  it("operates architecture and tenant scale registries", () => {
    const result = runMultiTenantProductionFoundation();

    expect(result.architecture_registry.operational).toBe(true);
    expect(result.architecture_registry.registered_topologies).toHaveLength(8);
    expect(result.tenant_scale_registry.operational).toBe(true);
    expect(result.tenant_scale_registry.tenant_records).toHaveLength(1);
    expect(result.tenant_scale_registry.tenant_records[0].certification_status).toBe("CERTIFIED");
  });

  it("defines responsibility and scaling authority models without execution authority", () => {
    const result = runMultiTenantProductionFoundation();

    expect(result.responsibility_model.responsibility_domains).toHaveLength(8);
    expect(result.responsibility_model.deterministic_authority_inheritance).toBe(true);
    expect(result.scaling_authority_model.governance_bypass_prohibited).toBe(true);
    expect(result.scaling_authority_model.grants_execution_authority).toBe(false);
  });

  it("preserves production boundary guarantees", () => {
    const result = runMultiTenantProductionFoundation();

    expect(result.boundary_contract.advisory_only_preserved).toBe(true);
    expect(result.boundary_contract.tenant_isolation_preserved).toBe(true);
    expect(result.boundary_contract.certification_scope_preserved).toBe(true);
    expect(result.boundary_contract.prior_guarantees_not_weakened).toBe(true);
  });

  it("produces a complete foundation certification package", () => {
    const result = runMultiTenantProductionFoundation();

    expect(result.certification_package.foundation_certified).toBe(true);
    expect(result.certification_package.production_architecture_complete).toBe(true);
    expect(result.certification_package.tenant_scale_registry_operational).toBe(true);
    expect(result.certification_package.evidence_refs.length).toBeGreaterThan(0);
  });

  it("is deterministic and replayable", () => {
    const first = runMultiTenantProductionFoundation();
    const second = runMultiTenantProductionFoundation();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateMultiTenantProductionFoundation(first).valid).toBe(true);
    expect(replayMultiTenantProductionFoundation(first)).toBe(true);
  });

  it("executes the Phase 17.1 foundation certification matrix", () => {
    const result = runMultiTenantProductionFoundation();

    expect(result.certification_tests).toHaveLength(13);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
  }, 300000);

  it("supports conditional pass for non-constitutional foundation warnings", () => {
    const result = runMultiTenantProductionFoundation({ scenario: "NON_CONSTITUTIONAL_FOUNDATION_WARNING" });
    const validation = validateMultiTenantProductionFoundation(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.certification_package.foundation_certified).toBe(true);
    expect(validation.valid).toBe(false);
  });

  it.each([
    "PRODUCTION_ARCHITECTURE_INCOMPLETE",
    "PRODUCTION_CONTRACT_NOT_APPROVED",
    "PRODUCTION_OWNERSHIP_NOT_DEFINED",
    "TENANT_RESPONSIBILITIES_NOT_GOVERNED",
    "SCALING_NOT_DETERMINISTIC",
    "CONSTITUTIONAL_INVARIANTS_NOT_ENFORCED",
    "ARCHITECTURE_REGISTRY_NOT_OPERATIONAL",
    "TENANT_SCALE_REGISTRY_NOT_OPERATIONAL",
    "CERTIFICATION_BOUNDARIES_NOT_ESTABLISHED",
    "REPLAY_NOT_PRESERVED",
    "TENANT_ISOLATION_NOT_VALIDATED",
    "FOUNDATION_CERTIFICATION_NOT_COMPLETED",
    "PHASE_16_12_CERTIFICATION_NOT_PASS",
  ] as const)("fails certification for %s", (scenario: MultiTenantProductionFoundationFailure) => {
    const result = runMultiTenantProductionFoundation({ scenario });
    const validation = validateMultiTenantProductionFoundation(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested registry tampering", () => {
    const result = runMultiTenantProductionFoundation();
    const tampered = {
      ...result,
      architecture_registry: {
        ...result.architecture_registry,
        operational: false,
      },
    };

    expect(validateMultiTenantProductionFoundation(tampered).valid).toBe(false);
  });
});
