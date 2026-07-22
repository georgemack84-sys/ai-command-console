import { describe, expect, it } from "vitest";
import { getObservabilityPlatformBundle, replayObservabilityPlatform, runObservabilityPlatform, validateObservabilityPlatform } from "@/services/observability-platform";
import type { ObservabilityPlatformFailure } from "@/types/observability-platform";

const CONDITIONAL_FAILURES: readonly ObservabilityPlatformFailure[] = [
  "LOGGING_FOUNDATION_MISSING",
  "STRUCTURED_LOG_SCHEMA_INVALID",
  "CORRELATION_IDS_MISSING",
  "METRICS_PLATFORM_MISSING",
  "METRICS_REGISTRY_MISSING",
  "DISTRIBUTED_TRACING_MISSING",
  "TRACE_CORRELATION_FAILED",
  "HEALTH_MONITORING_MISSING",
  "READINESS_CHECKS_FAILED",
  "DEPENDENCY_HEALTH_MISSING",
  "ALERTING_MISSING",
  "ALERT_GENERATION_NON_DETERMINISTIC",
  "ESCALATION_POLICIES_MISSING",
  "DASHBOARDS_MISSING",
  "DASHBOARD_ACCURACY_FAILED",
  "DIAGNOSTICS_MISSING",
  "DIAGNOSTIC_NON_DETERMINISTIC",
  "FAILURE_CORRELATION_FAILED",
  "OBSERVABILITY_EVIDENCE_MISSING",
  "OPERATIONAL_READINESS_FAILED",
];

const FAIL_CLOSED_FAILURES: readonly ObservabilityPlatformFailure[] = [
  "W1_4A_REGISTRY_CORE_INVALID",
  "W1_5_CONFIGURATION_PLATFORM_INVALID",
  "TENANT_AWARE_LOGGING_FAILED",
  "METRICS_INTEGRITY_FAILED",
  "TRACE_LINEAGE_INVALID",
  "TENANT_DASHBOARD_ISOLATION_FAILED",
  "TENANT_ISOLATION_FAILED",
  "OBSERVABILITY_EVIDENCE_NOT_IMMUTABLE",
];

describe("W1.6 Observability Platform", () => {
  it("publishes observability-platform doctrine and validates baseline", () => {
    const bundle = getObservabilityPlatformBundle();

    expect(bundle.doctrine.version).toBe("observability-platform/w1.6");
    expect(bundle.doctrine.owns_logging).toBe(true);
    expect(bundle.doctrine.owns_metrics).toBe(true);
    expect(bundle.doctrine.owns_distributed_tracing).toBe(true);
    expect(bundle.doctrine.owns_health_monitoring).toBe(true);
    expect(bundle.doctrine.owns_alerting).toBe(true);
    expect(bundle.doctrine.owns_operational_dashboards).toBe(true);
    expect(bundle.doctrine.owns_diagnostics).toBe(true);
    expect(bundle.doctrine.owns_observability_evidence).toBe(true);
    expect(bundle.doctrine.exit_state).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic observability qualification with registry and configuration references", () => {
    const first = runObservabilityPlatform();
    const second = runObservabilityPlatform();

    expect(first.phase_identifier).toBe("ObservabilityPlatform");
    expect(first.registry_core_ref).toBe("registry-core/w1.4a");
    expect(first.configuration_platform_ref).toBe("configuration-platform/w1.5");
    expect(first.evidence.records).toHaveLength(8);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateObservabilityPlatform(first).valid).toBe(true);
    expect(replayObservabilityPlatform(first)).toBe(true);
  });

  it("qualifies logging, metrics, distributed tracing, and health monitoring", () => {
    const result = runObservabilityPlatform();

    expect(result.logging.structured_schema).toBe(true);
    expect(result.logging.correlation_ids).toBe(true);
    expect(result.logging.tenant_aware).toBe(true);
    expect(result.logging.immutable_log_events).toBe(true);
    expect(result.metrics.metrics_registry).toBe(true);
    expect(result.metrics.service_metrics).toBe(true);
    expect(result.metrics.tenant_metrics).toBe(true);
    expect(result.metrics.capacity_metrics).toBe(true);
    expect(result.tracing.end_to_end_traces).toBe(true);
    expect(result.tracing.correlation_validation).toBe(true);
    expect(result.tracing.trace_lineage).toBe(true);
    expect(result.health.liveness_checks).toBe(true);
    expect(result.health.readiness_checks).toBe(true);
    expect(result.health.dependency_health).toBe(true);
    expect(result.health.tenant_health).toBe(true);
  });

  it("qualifies alerting, dashboards, diagnostics, evidence, and readiness", () => {
    const result = runObservabilityPlatform();

    expect(result.alerting.threshold_alerts).toBe(true);
    expect(result.alerting.configuration_alerts).toBe(true);
    expect(result.alerting.security_alerts).toBe(true);
    expect(result.alerting.deterministic_generation).toBe(true);
    expect(result.dashboards.platform_dashboard).toBe(true);
    expect(result.dashboards.tenant_dashboard).toBe(true);
    expect(result.dashboards.executive_dashboard).toBe(true);
    expect(result.diagnostics.root_cause_analysis).toBe(true);
    expect(result.diagnostics.failure_correlation).toBe(true);
    expect(result.diagnostics.deterministic).toBe(true);
    expect(result.evidence.logging_evidence).toBe(true);
    expect(result.evidence.qualification_evidence).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.qualification.qualified).toBe(true);
    expect(result.readiness.decision).toBe("QUALIFIED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks observability platform conditionally qualified for remediable deficiency %s", (failure) => {
    const result = runObservabilityPlatform({ scenario: failure });
    const validation = validateObservabilityPlatform(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("marks observability platform not qualified when qualification fails", () => {
    const result = runObservabilityPlatform({ scenario: "OBSERVABILITY_QUALIFICATION_FAILED" });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateObservabilityPlatform(result).valid).toBe(false);
  });

  it.each(FAIL_CLOSED_FAILURES)("fails closed for critical observability defect %s", (failure) => {
    const result = runObservabilityPlatform({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateObservabilityPlatform(result).valid).toBe(false);
  });

  it("keeps qualified-with-observations and conditional follow-up outside full qualification", () => {
    const observed = runObservabilityPlatform({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const conditional = runObservabilityPlatform({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.phase_ready).toBe(false);
    expect(validateObservabilityPlatform(observed).valid).toBe(false);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
