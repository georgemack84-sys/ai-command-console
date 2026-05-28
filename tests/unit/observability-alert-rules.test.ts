import { describe, expect, it } from "vitest";

import { evaluateAlerts } from "../../services/observability/alertEvaluator.ts";
import { registerDefaultAlertRules } from "../../services/observability/registerDefaultAlertRules.ts";
import type { ObservabilityMetricSnapshot } from "../../services/observability/metricTypes.ts";

function createSnapshot(metricName: string, value: number | string | null, status: "OK" | "WARNING" | "CRITICAL" | "UNKNOWN"): ObservabilityMetricSnapshot {
  return {
    snapshotId: "snapshot-1",
    generatedAt: "2026-05-07T00:00:00.000Z",
    healthStatus: metricName === "systemHealthStatus" ? String(value) as any : "DEGRADED",
    metrics: [
      {
        name: metricName as any,
        value,
        unit: typeof value === "number" ? "count" : "status",
        status,
        source: metricName === "systemHealthStatus" ? "health" : "contracts",
        measuredAt: "2026-05-07T00:00:00.000Z",
        component: metricName === "systemHealthStatus" ? "telemetry" : "contracts",
      },
    ],
    sources: [],
    degradedSignals: [],
    unknownSignals: [],
  };
}

describe("observability alert rules", () => {
  it("triggers lock contention threshold alerts", () => {
    const alerts = evaluateAlerts({
      rules: registerDefaultAlertRules(),
      snapshot: createSnapshot("lockContentionRate", 0.3, "WARNING"),
      generatedAt: "2026-05-07T00:00:00.000Z",
    });

    expect(alerts.some((alert) => alert.ruleId === "lock-contention-warning")).toBe(true);
  });

  it("triggers verification mismatch spike alerts", () => {
    const alerts = evaluateAlerts({
      rules: registerDefaultAlertRules(),
      snapshot: createSnapshot("verificationMismatches", 6, "CRITICAL"),
      generatedAt: "2026-05-07T00:00:00.000Z",
    });

    expect(alerts.some((alert) => alert.ruleId === "verification-mismatches-critical")).toBe(true);
  });

  it("triggers failed recovery and replay validation alerts", () => {
    const rules = registerDefaultAlertRules();
    const failedRecoveryAlerts = evaluateAlerts({
      rules,
      snapshot: createSnapshot("failedRecoveries", 1, "CRITICAL"),
      generatedAt: "2026-05-07T00:00:00.000Z",
    });
    const replayAlerts = evaluateAlerts({
      rules,
      snapshot: createSnapshot("replayValidationFailures", 1, "CRITICAL"),
      generatedAt: "2026-05-07T00:00:00.000Z",
    });

    expect(failedRecoveryAlerts.some((alert) => alert.ruleId === "failed-recoveries-high")).toBe(true);
    expect(replayAlerts.some((alert) => alert.ruleId === "replay-validation-failures-high")).toBe(true);
  });

  it("triggers compatibility and unhealthy system alerts", () => {
    const rules = registerDefaultAlertRules();
    const compatibilityAlerts = evaluateAlerts({
      rules,
      snapshot: createSnapshot("contractCompatibilityFailures", 1, "CRITICAL"),
      generatedAt: "2026-05-07T00:00:00.000Z",
    });
    const healthAlerts = evaluateAlerts({
      rules,
      snapshot: createSnapshot("systemHealthStatus", "UNHEALTHY", "CRITICAL"),
      generatedAt: "2026-05-07T00:00:00.000Z",
    });

    expect(compatibilityAlerts.some((alert) => alert.ruleId === "contract-compatibility-failures-high")).toBe(true);
    expect(healthAlerts.some((alert) => alert.ruleId === "system-health-unhealthy")).toBe(true);
  });
});
