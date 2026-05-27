import { describe, expect, it } from "vitest";

import { buildMonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import { buildMonitoringTriggerFixture } from "./helpers";

describe("triggerCorrelationEngine", () => {
  it("escalates faster under correlated uncertainty", () => {
    const { input } = buildMonitoringTriggerFixture({
      confidenceScore: 0.2,
      previousConfidenceScore: 0.92,
      runtimeObservation: Object.freeze({
        heartbeatState: "missing",
        leaseState: "unstable",
        queueDepth: 120,
        retryRate: 0.65,
        telemetryTimestamp: "2026-05-16T16:14:00.000Z",
      }),
    });
    const escalatedInput = Object.freeze({
      ...input,
      governanceView: Object.freeze({
        ...input.governanceView,
        state: "ESCALATE" as const,
      }),
      replay: Object.freeze({
        ...input.replay,
        status: "DRIFT_DETECTED" as const,
      }),
    });
    const model = buildMonitoringTriggerModel(escalatedInput);
    expect(model.correlations.length).toBeGreaterThan(0);
    expect(model.freezeRecommendations.some((recommendation) => recommendation.reason === "trigger_correlation")).toBe(true);
  });
});
