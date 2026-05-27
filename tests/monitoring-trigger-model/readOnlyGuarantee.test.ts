import { describe, expect, it } from "vitest";

import { assertTriggerSourcesAreReadOnly, buildMonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import { buildMonitoringTriggerFixture, loadMonitoringTriggerSources } from "./helpers";

describe("monitoring trigger read-only guarantees", () => {
  it("does not mutate source inputs", () => {
    const { input } = buildMonitoringTriggerFixture();
    const before = JSON.stringify(input);
    buildMonitoringTriggerModel(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("does not import execution or orchestration behavior", () => {
    const sources = loadMonitoringTriggerSources();
    for (const source of sources) {
      if (source.path.endsWith("triggerGuards.ts")) {
        continue;
      }
      expect(assertTriggerSourcesAreReadOnly(source.content)).toEqual([]);
    }
  });
});
