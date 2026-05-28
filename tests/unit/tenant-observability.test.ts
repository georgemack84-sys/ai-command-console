import { beforeEach, describe, expect, it } from "vitest";

import { createTenantContext } from "../../services/tenancy/tenantContext.ts";
import { createStructuredLogEvent } from "../../services/observability/structuredLogger.ts";
import { deduplicateAlerts } from "../../services/observability/alertDeduplication.ts";
import { resetContractTelemetry, recordContractTelemetry } from "../../services/contracts/contractTelemetry.ts";
import { buildContractObservabilitySnapshot } from "../../services/observability/contractObservabilityAdapter.ts";

describe("tenant observability", () => {
  beforeEach(() => {
    resetContractTelemetry();
  });

  it("includes tenantId in structured log events", () => {
    const context = createTenantContext({
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      source: "test",
    });

    const event = createStructuredLogEvent(
      {
        level: "INFO",
        category: "telemetry",
        message: "snapshot generated",
        source: "observability.metrics",
        tenantContext: context,
      },
      { now: () => "2026-05-07T00:00:00.000Z" },
    );

    expect(event.tenantId).toBe("tenant-1");
    expect(event.workspaceId).toBe("workspace-1");
  });

  it("partitions contract telemetry by tenant", () => {
    recordContractTelemetry("replay_validation_failed", { tenantId: "tenant-1" });
    recordContractTelemetry("replay_validation_failed", { tenantId: "tenant-2" });

    const snapshot = buildContractObservabilitySnapshot({
      generatedAt: "2026-05-07T00:00:00.000Z",
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
    });

    expect(snapshot.metrics.replayValidationFailures.value).toBe(1);
  });

  it("deduplicates alerts only within the same tenant", () => {
    const alerts = deduplicateAlerts([
      {
        alertId: "a1",
        ruleId: "system-health-unhealthy",
        severity: "CRITICAL",
        status: "ACTIVE",
        reason: "bad",
        metricName: "systemHealthStatus",
        observedValue: "UNHEALTHY",
        threshold: "UNHEALTHY",
        triggeredAt: "2026-05-07T00:00:00.000Z",
        correlationId: "same",
        source: "health",
        recommendedAction: "act",
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
      },
      {
        alertId: "a2",
        ruleId: "system-health-unhealthy",
        severity: "CRITICAL",
        status: "ACTIVE",
        reason: "bad",
        metricName: "systemHealthStatus",
        observedValue: "UNHEALTHY",
        threshold: "UNHEALTHY",
        triggeredAt: "2026-05-07T00:00:00.000Z",
        correlationId: "same",
        source: "health",
        recommendedAction: "act",
        tenantId: "tenant-2",
        workspaceId: "workspace-2",
      },
    ] as any);

    expect(alerts).toHaveLength(2);
  });
});
