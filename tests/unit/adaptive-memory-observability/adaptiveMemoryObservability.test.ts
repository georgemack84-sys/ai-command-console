import { describe, expect, it } from "vitest";
import {
  establishAdaptiveMemoryObservability,
  getAdaptiveMemoryObservability,
  replayAdaptiveMemoryObservability,
} from "@/services/adaptive-memory-observability";
import type {
  ObservabilityFailure,
  ObservabilityHealthState,
  ObservabilityScenario,
  ObservabilityValidator,
} from "@/types/adaptive-memory-observability";

describe("Mission Control Phase 10.13K Adaptive Memory Observability", () => {
  const validators: readonly ObservabilityValidator[] = [
    "TELEMETRY_COLLECTION",
    "METRIC_GENERATION",
    "RETRIEVAL_ANALYTICS",
    "REUSE_ANALYTICS",
    "GOVERNANCE_ANALYTICS",
    "REPLAY_ANALYTICS",
    "SIMILARITY_ANALYTICS",
    "DASHBOARD_VALIDATION",
    "TENANT_PRIVACY_VALIDATION",
    "INTEGRITY_VERIFICATION",
  ];

  const healthStates: readonly ObservabilityHealthState[] = ["HEALTHY", "DEGRADED", "CRITICAL"];

  it("publishes the authoritative adaptive memory observability contract", () => {
    const platform = getAdaptiveMemoryObservability();

    expect(platform.adaptive_memory_observability_version).toBe("adaptive-memory-observability/v1");
    expect(platform.supported_validators).toEqual(validators);
    expect(platform.supported_health_states).toEqual(healthStates);
    expect(platform.api_surface.establish_observability).toBe("POST /adaptive-memory-observability/establish");
    expect(platform.api_surface.retrieve_contract).toBe("GET /adaptive-memory-observability/contract");
    expect(platform.api_surface.execution_influence_supported).toBe(false);
    expect(platform.api_surface.tenant_bypass_supported).toBe(false);
    expect(platform.api_surface.unauthorized_dashboard_supported).toBe(false);
    expect(platform.result.platform_identifier).toBe("AdaptiveMemoryObservability");
    expect(platform.result.status).toBe("AUTHORITATIVE");
  });

  it("establishes deterministic telemetry, analytics, ledger, and integrity", () => {
    const first = establishAdaptiveMemoryObservability();
    const second = establishAdaptiveMemoryObservability();

    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.retrieval_analytics.integrity_hash).toBe(second.retrieval_analytics.integrity_hash);
    expect(first.reuse_analytics.integrity_hash).toBe(second.reuse_analytics.integrity_hash);
    expect(first.governance_dashboard.integrity_hash).toBe(second.governance_dashboard.integrity_hash);
    expect(first.observability_ledger.map((entry) => entry.integrity_hash)).toEqual(second.observability_ledger.map((entry) => entry.integrity_hash));
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayAdaptiveMemoryObservability(first)).toBe(true);
  });

  it("measures adaptive memory operations without execution authority", () => {
    const result = establishAdaptiveMemoryObservability();

    expect(result.contract.complete_visibility).toBe(true);
    expect(result.contract.observability_without_authority).toBe(true);
    expect(result.contract.deterministic_metrics).toBe(true);
    expect(result.contract.governance_transparency).toBe(true);
    expect(result.contract.execution_influence_supported).toBe(false);
    expect(result.execution_influence_prevented).toBe(true);
    expect(result.metrics.lifecycle_transitions).toBe(10);
    expect(result.metrics.retrieval_rate).toBe(20);
    expect(result.metrics.reuse_frequency).toBe(4);
  });

  it("publishes retrieval and reuse analytics", () => {
    const result = establishAdaptiveMemoryObservability();

    expect(result.retrieval_analytics.requests_per_mission).toBe(10);
    expect(result.retrieval_analytics.requests_per_tenant).toBe(20);
    expect(result.retrieval_analytics.successful_retrievals).toBe(20);
    expect(result.retrieval_analytics.denied_retrievals).toBe(0);
    expect(result.retrieval_analytics.authorization_preserved).toBe(true);
    expect(result.reuse_analytics.successful_reuse).toBe(4);
    expect(result.reuse_analytics.rejected_reuse).toBe(0);
    expect(result.reuse_analytics.expired_reuse_attempts).toBe(2);
  });

  it("publishes governance, replay, and similarity visibility", () => {
    const result = establishAdaptiveMemoryObservability();

    expect(result.governance_dashboard.governance_approvals).toBe(10);
    expect(result.governance_dashboard.governance_denials).toBe(0);
    expect(result.governance_dashboard.tenant_aware).toBe(true);
    expect(result.replay_observability.replay_requests).toBe(10);
    expect(result.replay_observability.replay_success).toBe(1);
    expect(result.replay_observability.replay_integrity).toBe("VERIFIED");
    expect(result.similarity_observability.similarity_requests).toBe(8);
    expect(result.similarity_observability.deterministic_scoring).toBe(true);
    expect(result.similarity_observability.similarity_replay).toBe(true);
  });

  it("reports healthy adaptive memory subsystem health", () => {
    const health = establishAdaptiveMemoryObservability().health;

    expect(health.storage_health).toBe("HEALTHY");
    expect(health.index_health).toBe("HEALTHY");
    expect(health.replay_health).toBe("HEALTHY");
    expect(health.governance_health).toBe("HEALTHY");
    expect(health.qualification_health).toBe("HEALTHY");
    expect(health.similarity_health).toBe("HEALTHY");
    expect(health.integrity_health).toBe("HEALTHY");
    expect(health.lifecycle_health).toBe("HEALTHY");
    expect(health.overall_health).toBe("HEALTHY");
  });

  it("records append-only immutable observability ledger events", () => {
    const result = establishAdaptiveMemoryObservability();

    expect(result.observability_ledger).toHaveLength(10);
    expect(result.observability_ledger.every((entry) => entry.append_only)).toBe(true);
    expect(result.observability_ledger.every((entry) => entry.immutable)).toBe(true);
    expect(result.observability_ledger.every((entry) => entry.deterministic)).toBe(true);
    expect(result.observability_ledger.every((entry) => entry.replayable)).toBe(true);
    expect(result.observability_ledger.every((entry) => entry.tenant_isolated)).toBe(true);
    expect(result.observability_ledger.every((entry) => entry.cryptographically_verified)).toBe(true);
  });

  it("publishes operational metrics for the observability platform", () => {
    const operational = establishAdaptiveMemoryObservability().operational_metrics;

    expect(operational.telemetry_collections).toBe(1);
    expect(operational.metric_generations).toBe(1);
    expect(operational.dashboard_updates).toBe(1);
    expect(operational.alert_count).toBe(0);
    expect(operational.health_score).toBe(1);
    expect(operational.deterministic_metric_rate).toBe(1);
    expect(operational.replayable_metric_rate).toBe(1);
    expect(operational.tenant_safe_metric_rate).toBe(1);
    expect(operational.integrity_failures).toBe(0);
  });

  it.each([
    ["LIFECYCLE_MANAGER_UNAVAILABLE", "LIFECYCLE_MANAGER_UNAVAILABLE"],
    ["NONDETERMINISTIC_METRICS", "METRICS_NONDETERMINISTIC"],
    ["DASHBOARD_INCONSISTENCY", "DASHBOARD_DATA_INCONSISTENT"],
    ["MISSING_TELEMETRY", "TELEMETRY_MISSING"],
    ["UNREPRODUCIBLE_REPLAY_METRICS", "REPLAY_METRICS_UNREPRODUCIBLE"],
    ["GOVERNANCE_UNOBSERVABLE", "GOVERNANCE_EVENTS_UNOBSERVABLE"],
    ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_VIOLATED"],
    ["HISTORY_ALTERED", "OPERATIONAL_HISTORY_ALTERED"],
    ["UNAUTHORIZED_DASHBOARD_ACCESS", "UNAUTHORIZED_DASHBOARD_ACCESS_SUCCEEDED"],
    ["OBSERVABILITY_INFLUENCE", "OBSERVABILITY_INFLUENCED_EXECUTION"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
  ] as const)("rejects unsafe observability condition %s", (scenario: ObservabilityScenario, failure: ObservabilityFailure) => {
    const result = establishAdaptiveMemoryObservability({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.failures).toContain(failure);
    expect(result.health.overall_health).not.toBe("HEALTHY");
    expect(replayAdaptiveMemoryObservability(result)).toBe(true);
  });

  it("generates deterministic alerts for observability anomalies", () => {
    const replay = establishAdaptiveMemoryObservability({ scenario: "UNREPRODUCIBLE_REPLAY_METRICS" });
    const tenant = establishAdaptiveMemoryObservability({ scenario: "TENANT_ISOLATION_BREACH" });
    const integrity = establishAdaptiveMemoryObservability({ scenario: "INTEGRITY_FAILURE" });

    expect(replay.alerts.some((alert) => alert.alert_type === "REPLAY_FAILURE")).toBe(true);
    expect(tenant.alerts.some((alert) => alert.alert_type === "TENANT_ISOLATION_VIOLATION" && alert.tenant_safe === false)).toBe(true);
    expect(integrity.alerts.some((alert) => alert.alert_type === "INTEGRITY_FAILURE" && alert.severity === "CRITICAL")).toBe(true);
  });

  it("detects missing telemetry, governance invisibility, and execution influence", () => {
    const telemetry = establishAdaptiveMemoryObservability({ scenario: "MISSING_TELEMETRY" });
    const governance = establishAdaptiveMemoryObservability({ scenario: "GOVERNANCE_UNOBSERVABLE" });
    const influence = establishAdaptiveMemoryObservability({ scenario: "OBSERVABILITY_INFLUENCE" });

    expect(telemetry.telemetry_complete).toBe(false);
    expect(telemetry.metrics.retrieval_rate).toBe(0);
    expect(governance.governance_dashboard.governance_approvals).toBe(0);
    expect(influence.execution_influence_prevented).toBe(false);
  });

  it("preserves tenant-safe dashboard visibility", () => {
    const result = establishAdaptiveMemoryObservability();

    expect(result.tenant_isolation_preserved).toBe(true);
    expect(result.privacy_preserved).toBe(true);
    expect(result.validation_reports.every((report) => report.tenant_safe)).toBe(true);
    expect(result.metrics.tenant_id).toBe(result.lifecycle_result.lifecycle_records[0].tenant_id);
  });

  it("detects nested observability metric tampering", () => {
    const result = establishAdaptiveMemoryObservability();
    const tampered = {
      ...result,
      metrics: {
        ...result.metrics,
        retrieval_rate: 999,
      },
    };

    expect(replayAdaptiveMemoryObservability(tampered)).toBe(false);
  });
});
