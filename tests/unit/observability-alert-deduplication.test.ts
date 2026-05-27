import { describe, expect, it } from "vitest";

import { deduplicateAlerts } from "../../services/observability/alertDeduplication.ts";
import type { ObservabilityAlert } from "../../services/observability/alertTypes.ts";

function alert(overrides: Partial<ObservabilityAlert>): ObservabilityAlert {
  return {
    alertId: "alert-1",
    ruleId: "lock-contention-warning",
    severity: "WARNING",
    status: "ACTIVE",
    reason: "Lock contention elevated",
    metricName: "lockContentionRate",
    observedValue: 0.3,
    threshold: 0.25,
    triggeredAt: "2026-05-07T00:00:00.000Z",
    correlationId: "corr-1",
    source: "locks",
    recommendedAction: "Inspect lock pressure.",
    ...overrides,
  };
}

describe("observability alert deduplication", () => {
  it("collapses duplicate alerts deterministically and preserves escalation", () => {
    const result = deduplicateAlerts([
      alert(),
      alert({
        alertId: "alert-2",
        severity: "HIGH",
        observedValue: 0.6,
        threshold: 0.5,
      }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("HIGH");
  });

  it("keeps distinct sources distinct", () => {
    const result = deduplicateAlerts([
      alert(),
      alert({
        alertId: "alert-3",
        source: "contracts",
        correlationId: "corr-2",
      }),
    ]);

    expect(result).toHaveLength(2);
  });
});
