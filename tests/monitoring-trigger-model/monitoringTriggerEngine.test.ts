import { describe, expect, it } from "vitest";

import { buildMonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import { buildMonitoringTriggerFixture } from "./helpers";

describe("monitoringTriggerEngine", () => {
  it("builds deterministic constitutional monitoring evidence", () => {
    const { input } = buildMonitoringTriggerFixture();
    const first = buildMonitoringTriggerModel(input);
    const second = buildMonitoringTriggerModel(input);
    expect(first.triggerHash).toBe(second.triggerHash);
    expect(first.derivedOnly).toBe(true);
    expect(first.triggers.some((trigger) => trigger.triggerType === "confidence")).toBe(true);
  });

  it("derives stronger caution as confidence decreases", () => {
    const calm = buildMonitoringTriggerFixture({
      confidenceScore: 0.88,
      previousConfidenceScore: 0.9,
    }).model;
    const tense = buildMonitoringTriggerFixture({
      confidenceScore: 0.18,
      previousConfidenceScore: 0.9,
    }).model;
    expect(calm.cautionState).toBe("observe");
    expect(tense.cautionState).toBe("frozen-recommended");
  });
});
