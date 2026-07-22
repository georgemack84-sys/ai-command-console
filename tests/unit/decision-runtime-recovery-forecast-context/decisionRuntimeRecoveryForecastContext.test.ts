import { describe, expect, it } from "vitest";
import { createDecisionContext, validateDecisionContext } from "@/services/decision-context-contract";
import {
  buildRuntimeRecoveryForecastObservability,
  createRuntimeRecoveryForecastContextRequest,
  getRuntimeRecoveryForecastContextResolver,
  replayRuntimeRecoveryForecastContext,
  resolveRuntimeRecoveryForecastContext,
} from "@/services/decision-runtime-recovery-forecast-context";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";

describe("Mission Control Phase 9.3.7 Runtime, Recovery & Forecast Context Resolver", () => {
  function normalizedCandidate() {
    const normalized = normalizeDecisionCandidateInput();
    if (!normalized.candidate) throw new Error("expected normalized candidate");
    return normalized.candidate;
  }

  it("resolves deterministic runtime, recovery, and forecast context", () => {
    const pkg = resolveRuntimeRecoveryForecastContext();

    expect(pkg.validation.validation_status).toBe("PASS");
    expect(pkg.validation.validation_state).toBe("PASSED");
    expect(pkg.runtime_context.runtime_health).toBe("Healthy");
    expect(pkg.runtime_context.system_stability).toBe("STABLE");
    expect(pkg.runtime_context.resource_availability).toBe("AVAILABLE");
    expect(pkg.runtime_context.operational_capacity).toBeGreaterThan(0.7);
    expect(pkg.recovery_context.recovery_readiness).toBe("READY");
    expect(pkg.recovery_context.rollback_capability).toBe("AVAILABLE");
    expect(pkg.recovery_context.continuity_status).toBe("Recovery Ready");
    expect(pkg.forecast_context.forecast_impact).toBe("Watch");
    expect(pkg.forecast_context.projected_mission_effects).toContain("improved_context_certification");
    expect(pkg.forecast_context.projected_risks).toContain("queue_capacity_watch");
    expect(pkg.runtime_domain.domain_name).toBe("runtime_context");
    expect(pkg.recovery_domain.domain_name).toBe("recovery_context");
    expect(pkg.forecast_domain.domain_name).toBe("forecast_context");
    expect(pkg.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces identical packages for identical inputs", () => {
    const request = createRuntimeRecoveryForecastContextRequest();
    const first = resolveRuntimeRecoveryForecastContext(request);
    const second = resolveRuntimeRecoveryForecastContext(request);

    expect(second.runtime_context).toEqual(first.runtime_context);
    expect(second.recovery_context).toEqual(first.recovery_context);
    expect(second.forecast_context).toEqual(first.forecast_context);
    expect(second.integrity_hash).toBe(first.integrity_hash);
  });

  it("documents transparent operational explainability", () => {
    const pkg = resolveRuntimeRecoveryForecastContext();

    expect(pkg.runtime_context.explainability.runtime_health_rationale).toContain("certified telemetry");
    expect(pkg.recovery_context.explainability.rollback_analysis).toContain("context_package_only");
    expect(pkg.forecast_context.explainability.forecast_methodology).toBe("mission-operational-forecast/v1 deterministic registry projection.");
    expect(pkg.forecast_context.explainability.constitutional_influence).toContain("constitution_advisory_only_v1");
  });

  it("can patch the 9.3.1 runtime, recovery, and forecast domains", () => {
    const candidate = normalizedCandidate();
    const pkg = resolveRuntimeRecoveryForecastContext(createRuntimeRecoveryForecastContextRequest({ candidate }));
    const context = createDecisionContext({
      candidate,
      domain_overrides: {
        runtime_context: pkg.runtime_domain,
        recovery_context: pkg.recovery_domain,
        forecast_context: pkg.forecast_domain,
      },
    });

    expect(context.runtime_context.originating_record).toBe(pkg.runtime_domain.originating_record);
    expect(context.recovery_context.originating_record).toBe(pkg.recovery_domain.originating_record);
    expect(context.forecast_context.originating_record).toBe(pkg.forecast_domain.originating_record);
    expect(validateDecisionContext(context).validation_state).toBe("VALID");
  });

  it("fails closed when runtime telemetry is unavailable", () => {
    const candidate = { ...normalizedCandidate(), mission_id: "mission_without_runtime" };
    const pkg = resolveRuntimeRecoveryForecastContext(createRuntimeRecoveryForecastContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.failure_reasons).toContain("RUNTIME_TELEMETRY_UNAVAILABLE");
    expect(pkg.validation.failure_reasons).toContain("RECOVERY_READINESS_UNRESOLVED");
    expect(pkg.validation.failure_reasons).toContain("FORECAST_ENGINE_UNAVAILABLE");
    expect(pkg.validation.checks.runtime_telemetry_available).toBe(false);
    expect(pkg.runtime_domain.status).toBe("UNAVAILABLE");
  });

  it("fails closed for cross-tenant operational references", () => {
    const candidate = { ...normalizedCandidate(), replay_refs: ["external_runtime_tenant_beta"] };
    const pkg = resolveRuntimeRecoveryForecastContext(createRuntimeRecoveryForecastContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_ISOLATION");
    expect(pkg.validation.failure_reasons).toContain("CROSS_TENANT_OPERATIONAL_REFERENCE");
    expect(pkg.validation.checks.tenant_isolated).toBe(false);
  });

  it("fails closed when upstream replay is incompatible", () => {
    const candidate = { ...normalizedCandidate(), evidence_refs: ["missing"] };
    const pkg = resolveRuntimeRecoveryForecastContext(createRuntimeRecoveryForecastContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.failure_reasons).toContain("REPLAY_INCOMPATIBLE");
    expect(pkg.validation.checks.replay_compatible).toBe(false);
  });

  it("replays runtime, recovery, and forecast context deterministically", () => {
    const pkg = resolveRuntimeRecoveryForecastContext();
    const replay = replayRuntimeRecoveryForecastContext(pkg);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_state).toBe("PASSED");
    expect(replay.failures).toEqual([]);
  });

  it("publishes resolver observability metrics", () => {
    const pass = resolveRuntimeRecoveryForecastContext();
    const missingRuntime = resolveRuntimeRecoveryForecastContext(createRuntimeRecoveryForecastContextRequest({
      candidate: { ...normalizedCandidate(), mission_id: "mission_without_runtime" },
    }));
    const crossTenant = resolveRuntimeRecoveryForecastContext(createRuntimeRecoveryForecastContextRequest({
      candidate: { ...normalizedCandidate(), replay_refs: ["external_runtime_tenant_beta"] },
    }));

    const metrics = buildRuntimeRecoveryForecastObservability([pass, missingRuntime, crossTenant]);

    expect(metrics.resolution_attempts).toBe(3);
    expect(metrics.successful_resolutions).toBe(1);
    expect(metrics.failed_resolutions).toBe(2);
    expect(metrics.runtime_failures).toBeGreaterThan(0);
    expect(metrics.recovery_failures).toBeGreaterThan(0);
    expect(metrics.forecast_failures).toBeGreaterThan(0);
    expect(metrics.isolation_failures).toBeGreaterThan(0);
    expect(metrics.average_operational_capacity).toBeGreaterThan(0);
    expect(metrics.average_forecast_confidence).toBeGreaterThan(0);
    expect(metrics.replay_success_rate).toBe(1);
  });

  it("exposes the runtime recovery forecast resolver package", () => {
    const resolver = getRuntimeRecoveryForecastContextResolver();

    expect(resolver.resolution_order).toContain("MISSION_EFFECTS_PROJECTED");
    expect(resolver.context_package.validation.validation_status).toBe("PASS");
    expect(resolver.replay.replay_valid).toBe(true);
    expect(resolver.observability.resolution_attempts).toBe(1);
  });
});
