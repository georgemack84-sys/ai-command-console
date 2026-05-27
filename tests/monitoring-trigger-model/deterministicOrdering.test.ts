import { describe, expect, it } from "vitest";

import { buildMonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import { buildMonitoringTriggerFixture } from "./helpers";

describe("monitoring trigger deterministic ordering", () => {
  it("produces the same hash regardless of override event ordering", () => {
    const base = buildMonitoringTriggerFixture();
    const reversedEvents = Object.freeze([...base.overrideFixture.input.events].reverse());
    const same = buildMonitoringTriggerFixture({ events: reversedEvents });
    const first = buildMonitoringTriggerModel(base.input);
    const second = buildMonitoringTriggerModel(same.input);
    expect(first.triggerHash).toBe(second.triggerHash);
  });
});
