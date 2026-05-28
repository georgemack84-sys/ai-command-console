import { describe, expect, it } from "vitest";

import { detectHiddenOrchestration } from "@/services/coordination-containment/hiddenOrchestrationDetector";

describe("detectHiddenOrchestration", () => {
  it("detects hidden scheduling and workflow markers", () => {
    const markers = detectHiddenOrchestration({
      orchestrationPlan: "schedule workflow dispatch",
    });

    expect(markers.length).toBeGreaterThan(0);
  });
});
