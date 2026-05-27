import { describe, expect, it } from "vitest";

import { detectHiddenOrchestration } from "@/services/coordination-containment/hiddenOrchestrationDetector";

describe("hidden scheduling rejection", () => {
  it("finds scheduling markers", () => {
    expect(detectHiddenOrchestration({ scheduleNext: "tomorrow" }).length).toBeGreaterThan(0);
  });
});
