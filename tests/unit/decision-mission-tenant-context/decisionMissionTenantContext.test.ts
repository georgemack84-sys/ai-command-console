import { describe, expect, it } from "vitest";
import {
  buildMissionTenantObservability,
  createMissionTenantContextRequest,
  getMissionTenantContextResolver,
  replayMissionTenantContext,
  resolveMissionTenantContext,
} from "@/services/decision-mission-tenant-context";
import { createDecisionContext, validateDecisionContext } from "@/services/decision-context-contract";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import type { MissionTenantFailureReason } from "@/types/decision-mission-tenant-context";

describe("Mission Control Phase 9.3.2 Mission & Tenant Context Resolver", () => {
  it("resolves deterministic mission and tenant context for a decision candidate", () => {
    const pkg = resolveMissionTenantContext();

    expect(pkg.validation.validation_status).toBe("PASS");
    expect(pkg.validation.validation_state).toBe("PASSED");
    expect(pkg.mission_context.mission_id).toBe("mission_phase_9_decision_orchestration");
    expect(pkg.mission_context.mission_phase).toBe("Decision Orchestration");
    expect(pkg.mission_context.mission_lifecycle_state).toBe("ACTIVE");
    expect(pkg.mission_context.mission_priority).toBe("High");
    expect(pkg.mission_context.mission_health.operational_readiness).toBe("READY");
    expect(pkg.tenant_context.tenant_id).toBe("tenant_alpha");
    expect(pkg.tenant_context.tenant_policies).toContain("policy_tenant_alpha_decision_orchestration_v1");
    expect(pkg.tenant_context.tenant_isolation_boundary).toBe("isolation_boundary_tenant_alpha");
    expect(pkg.mission_domain.domain_name).toBe("mission_context");
    expect(pkg.tenant_domain.domain_name).toBe("tenant_context");
    expect(pkg.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces identical context packages for identical inputs", () => {
    const request = createMissionTenantContextRequest();
    const first = resolveMissionTenantContext(request);
    const second = resolveMissionTenantContext(request);

    expect(second.mission_context).toEqual(first.mission_context);
    expect(second.tenant_context).toEqual(first.tenant_context);
    expect(second.cache_entry).toEqual(first.cache_entry);
    expect(second.tenant_registry).toEqual(first.tenant_registry);
    expect(second.integrity_hash).toBe(first.integrity_hash);
  });

  it("can patch the 9.3.1 context domains with resolved mission and tenant domains", () => {
    const normalized = normalizeDecisionCandidateInput();
    const pkg = resolveMissionTenantContext(createMissionTenantContextRequest({ candidate: normalized.candidate }));
    const context = createDecisionContext({
      candidate: normalized.candidate,
      domain_overrides: {
        mission_context: pkg.mission_domain,
        tenant_context: pkg.tenant_domain,
      },
    });

    expect(context.mission_context.originating_record).toBe(pkg.mission_domain.originating_record);
    expect(context.tenant_context.originating_record).toBe(pkg.tenant_domain.originating_record);
    expect(validateDecisionContext(context).validation_state).toBe("VALID");
  });

  it.each<[
    string,
    Parameters<typeof createMissionTenantContextRequest>[0],
    MissionTenantFailureReason,
  ]>([
    ["unknown mission", { expected_mission_id: "mission_unknown" }, "MISSION_NOT_FOUND"],
    ["mission identity mismatch", { expected_mission_id: "mission_archived" }, "MISSION_IDENTITY_MISMATCH"],
    ["unknown tenant", { expected_tenant_id: "tenant_unknown" }, "TENANT_NOT_FOUND"],
    ["tenant identity mismatch", { expected_tenant_id: "tenant_inactive" }, "TENANT_IDENTITY_MISMATCH"],
  ])("fails closed for %s", (_name, override, failure) => {
    const pkg = resolveMissionTenantContext(createMissionTenantContextRequest(override));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.failure_reasons).toContain(failure);
    expect(pkg.validation.failure_reason).toBe(failure);
    expect(pkg.validation.validation_state).not.toBe("PASSED");
    expect(pkg.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("detects cross-tenant contamination in candidate references", () => {
    const normalized = normalizeDecisionCandidateInput();
    const candidate = normalized.candidate ? {
      ...normalized.candidate,
      evidence_refs: ["evidence_tenant_beta_mission_phase_9_decision_orchestration_001"],
    } : undefined;
    const pkg = resolveMissionTenantContext(createMissionTenantContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_ISOLATION");
    expect(pkg.validation.failure_reasons).toContain("CROSS_TENANT_REFERENCE");
    expect(pkg.validation.checks.tenant_boundary_valid).toBe(false);
  });

  it("creates immutable mission cache and read-only tenant registry references", () => {
    const pkg = resolveMissionTenantContext();

    expect(pkg.cache_entry.cache_id).toContain(pkg.mission_context.mission_id);
    expect(pkg.cache_entry.mission_context).toEqual(pkg.mission_context);
    expect(pkg.cache_entry.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(pkg.tenant_registry.registry_id).toBe(`tenant_context_registry_${pkg.tenant_context.tenant_id}`);
    expect(pkg.tenant_registry.tenant_policy_refs).toEqual(pkg.tenant_context.tenant_policies);
    expect(pkg.tenant_registry.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("replays mission and tenant context deterministically", () => {
    const pkg = resolveMissionTenantContext();
    const replay = replayMissionTenantContext(pkg);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_state).toBe("PASSED");
    expect(replay.failures).toEqual([]);
  });

  it("publishes resolver observability metrics", () => {
    const pass = resolveMissionTenantContext();
    const missionFail = resolveMissionTenantContext(createMissionTenantContextRequest({ expected_mission_id: "mission_unknown" }));
    const tenantFail = resolveMissionTenantContext(createMissionTenantContextRequest({ expected_tenant_id: "tenant_unknown" }));

    const metrics = buildMissionTenantObservability([pass, missionFail, tenantFail]);

    expect(metrics.resolution_attempts).toBe(3);
    expect(metrics.successful_resolutions).toBe(1);
    expect(metrics.failed_resolutions).toBe(2);
    expect(metrics.mission_failures).toBeGreaterThan(0);
    expect(metrics.tenant_failures).toBeGreaterThan(0);
    expect(metrics.cache_entries_created).toBe(3);
    expect(metrics.registry_references).toBe(3);
    expect(metrics.replay_success_rate).toBe(1);
  });

  it("exposes the resolver foundation package", () => {
    const resolver = getMissionTenantContextResolver();

    expect(resolver.resolution_order).toContain("TENANT_BOUNDARY_VALIDATED");
    expect(resolver.context_package.validation.validation_status).toBe("PASS");
    expect(resolver.replay.replay_valid).toBe(true);
    expect(resolver.observability.resolution_attempts).toBe(1);
  });
});
