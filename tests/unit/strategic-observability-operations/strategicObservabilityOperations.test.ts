import { describe, expect, it } from "vitest";

import {
  getStrategicObservabilityOperationsContract,
  replayStrategicObservabilityOperations,
  runStrategicObservabilityOperations,
  validateStrategicObservabilityOperations,
} from "../../../services/strategic-observability-operations";
import type { StrategicOperationsScenario } from "../../../types/strategic-observability-operations";

describe("strategic observability operations", () => {
  it("creates deterministic certified operations telemetry", () => {
    const first = runStrategicObservabilityOperations();
    const second = runStrategicObservabilityOperations();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.certified).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateStrategicObservabilityOperations(first).valid).toBe(true);
    expect(replayStrategicObservabilityOperations(first)).toBe(true);
  });

  it("publishes read-only operational doctrine", () => {
    const bundle = getStrategicObservabilityOperationsContract();

    expect(bundle.doctrine.read_only_advisory).toBe(true);
    expect(bundle.doctrine.replayable_metrics_required).toBe(true);
    expect(bundle.doctrine.immutable_alert_history_required).toBe(true);
    expect(bundle.doctrine.tenant_isolated_views_required).toBe(true);
    expect(bundle.doctrine.runbooks_required).toBe(true);
    expect(bundle.doctrine.dashboards_non_authoritative).toBe(true);
  });

  it("builds dashboard, cycle, artifact, policy, and performance monitors", () => {
    const result = runStrategicObservabilityOperations();

    expect(result.dashboard.read_only).toBe(true);
    expect(result.dashboard.role_based_visibility).toBe(true);
    expect(result.cycle_monitor.timeout_detected).toBe(true);
    expect(result.artifact_health.anomalies_visible).toBe(true);
    expect(result.manifest_health.policy_binding_failures).toBeGreaterThan(0);
    expect(result.performance.bottlenecks_visible).toBe(true);
  });

  it("monitors observations, replay, integrity, governance, tenants, and derived views", () => {
    const result = runStrategicObservabilityOperations();

    expect(result.observation_health.overdue_closures).toBeGreaterThan(0);
    expect(result.replay_integrity.visible).toBe(true);
    expect(result.replay_integrity.integrity_failures).toBeGreaterThan(0);
    expect(result.governance_operations.bottlenecks_visible).toBe(true);
    expect(result.tenant_operations.immediately_visible).toBe(true);
    expect(result.derived_views.inconsistencies).toHaveLength(0);
  });

  it("generates deterministic alerts and validated runbooks", () => {
    const result = runStrategicObservabilityOperations();

    expect(result.alerts.routing_deterministic).toBe(true);
    expect(result.alerts.history_immutable).toBe(true);
    expect(result.alerts.alerts.every((alert) => alert.evidence.length > 0 && alert.replay_reference.length > 0)).toBe(true);
    expect(result.runbooks).toHaveLength(14);
    expect(result.runbooks.every((runbook) => runbook.validated && runbook.replay_validation)).toBe(true);
  });

  it("runs the phase 12.13 certification suite", () => {
    const result = runStrategicObservabilityOperations();

    expect(result.certification.tests).toHaveLength(16);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for operational blind spots and advisory-boundary violations", () => {
    const scenarios: readonly StrategicOperationsScenario[] = [
      "DASHBOARD_UNAVAILABLE",
      "ROLE_VISIBILITY_FAILURE",
      "CYCLE_STALLED_UNDETECTED",
      "BLOCKED_CYCLE_UNREPORTED",
      "ARTIFACT_ANOMALY_UNDETECTED",
      "POLICY_BINDING_FAILURE_HIDDEN",
      "PERFORMANCE_BOTTLENECK_HIDDEN",
      "OBSERVATION_OVERDUE_UNDETECTED",
      "REPLAY_FAILURE_HIDDEN",
      "INTEGRITY_FAILURE_HIDDEN",
      "GOVERNANCE_BACKLOG_HIDDEN",
      "TENANT_VIOLATION_HIDDEN",
      "DERIVED_VIEW_INCONSISTENT",
      "ALERT_ROUTING_NONDETERMINISTIC",
      "RUNBOOK_INVALID",
      "ADVISORY_BOUNDARY_VIOLATION",
    ];

    for (const scenario of scenarios) {
      const result = runStrategicObservabilityOperations({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.certified).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateStrategicObservabilityOperations(result).valid).toBe(false);
    }
  });
});
