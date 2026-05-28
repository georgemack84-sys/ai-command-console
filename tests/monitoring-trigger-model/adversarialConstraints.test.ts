import { describe, expect, it } from "vitest";

import { buildMonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import { buildMonitoringTriggerFixture } from "./helpers";

describe("monitoring trigger adversarial constraints", () => {
  it("fails closed on hidden execution metadata and runtime mutation metadata", () => {
    const { input } = buildMonitoringTriggerFixture({
      metadata: Object.freeze({
        runtimeBridge: true,
        executeNow: true,
        schedulerControl: true,
      }),
    });
    const model = buildMonitoringTriggerModel(input);
    expect(model.errors.map((error) => error.code)).toContain("TRIGGER_METADATA_FORBIDDEN");
  });

  it("fails closed on replay poisoning attempts", () => {
    const { input } = buildMonitoringTriggerFixture();
    const poisoned = Object.freeze({
      ...input,
      replay: Object.freeze({
        ...input.replay,
        status: "INVALID" as const,
        lineage: Object.freeze({
          ...input.replay.lineage,
          valid: false,
        }),
      }),
    });
    const model = buildMonitoringTriggerModel(poisoned);
    expect(model.errors.map((error) => error.code)).toContain("TRIGGER_REPLAY_MISMATCH");
  });
});
