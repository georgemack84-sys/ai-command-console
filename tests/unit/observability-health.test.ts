import { describe, expect, it } from "vitest";

import { buildSystemHealthSnapshot } from "../../services/observability/systemHealth.ts";
import type { ObservabilityMetric } from "../../services/observability/metricTypes.ts";

function metric(overrides: Partial<ObservabilityMetric>): ObservabilityMetric {
  return {
    name: "contractValidationFailures",
    value: 0,
    unit: "count",
    status: "OK",
    source: "contracts",
    measuredAt: "2026-05-07T00:00:00.000Z",
    component: "contracts",
    ...overrides,
  };
}

describe("observability health aggregation", () => {
  it("returns HEALTHY when all metrics are OK", () => {
    const health = buildSystemHealthSnapshot({
      generatedAt: "2026-05-07T00:00:00.000Z",
      metrics: [
        metric({ name: "contractValidationFailures", component: "contracts" }),
        metric({ name: "apiV1ValidationFailures", component: "apiV1" }),
        metric({ name: "samQueueDepth", component: "sam" }),
        metric({ name: "failedRecoveries", component: "recovery" }),
        metric({ name: "verificationMismatches", component: "verification" }),
        metric({ name: "lockContentionRate", component: "locks", value: 0, unit: "ratio" }),
        metric({ name: "systemHealthStatus", component: "telemetry", value: "HEALTHY", unit: "status" }),
      ],
    });

    expect(health.status).toBe("HEALTHY");
  });

  it("returns DEGRADED when warning metrics exist", () => {
    const health = buildSystemHealthSnapshot({
      generatedAt: "2026-05-07T00:00:00.000Z",
      metrics: [
        metric({ name: "contractValidationFailures", component: "contracts", status: "WARNING", value: 1 }),
      ],
    });

    expect(health.status).toBe("DEGRADED");
  });

  it("returns UNHEALTHY when critical metrics exist", () => {
    const health = buildSystemHealthSnapshot({
      generatedAt: "2026-05-07T00:00:00.000Z",
      metrics: [
        metric({ name: "replayValidationFailures", component: "contracts", status: "CRITICAL", value: 3 }),
      ],
    });

    expect(health.status).toBe("UNHEALTHY");
  });

  it("degrades safely when critical components are unknown", () => {
    const health = buildSystemHealthSnapshot({
      generatedAt: "2026-05-07T00:00:00.000Z",
      metrics: [
        metric({ name: "lockContentionRate", component: "locks", status: "UNKNOWN", value: null, unit: "ratio" }),
      ],
    });

    expect(health.status).toBe("DEGRADED");
  });
});
