import { describe, expect, it } from "vitest";

import { buildMonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import { buildMonitoringTriggerFixture } from "./helpers";

describe("freezeRecommendationEngine", () => {
  it("derives freeze recommendations as evidence only", () => {
    const { input } = buildMonitoringTriggerFixture({
      confidenceScore: 0.15,
      previousConfidenceScore: 0.9,
    });
    const replayMismatchInput = Object.freeze({
      ...input,
      replay: Object.freeze({
        ...input.replay,
        status: "DRIFT_DETECTED" as const,
      }),
    });
    const model = buildMonitoringTriggerModel(replayMismatchInput);
    expect(model.freezeRecommendations.length).toBeGreaterThan(0);
    expect(model.freezeRecommendations.some((recommendation) => recommendation.reason === "replay_mismatch" || recommendation.reason === "confidence_collapse")).toBe(true);
  });
});
