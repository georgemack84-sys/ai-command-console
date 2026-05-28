import { describe, expect, it } from "vitest";

import { appendTriggerLedger } from "@/services/monitoring-trigger-model";
import { buildMonitoringTriggerFixture } from "./helpers";

describe("triggerLedger", () => {
  it("appends immutable lineage entries", () => {
    const { model } = buildMonitoringTriggerFixture();
    const appended = appendTriggerLedger({
      existing: model.lineage,
      triggers: model.triggers,
      replayHash: model.replayBinding.reconstructionHash,
      lineageHash: model.replayBinding.overrideLineageHash,
      createdAt: "2026-05-16T16:16:00.000Z",
    });
    expect(appended.entries.length).toBe(model.lineage.entries.length + model.triggers.length);
    expect(appended.immutable).toBe(true);
  });
});
