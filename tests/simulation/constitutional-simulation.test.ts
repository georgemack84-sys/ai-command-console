import { describe, expect, it } from "vitest";

import { buildSovereigntySimulation } from "@/services/simulation/sovereigntySimulation";

describe("buildSovereigntySimulation", () => {
  it("remains deterministic and replay-safe", () => {
    const first = buildSovereigntySimulation({
      sovereigntyState: "SUPERVISED",
      survivabilityConfidence: 0.7,
      containmentPressure: 0.6,
      createdAt: 10,
    });
    const second = buildSovereigntySimulation({
      sovereigntyState: "SUPERVISED",
      survivabilityConfidence: 0.7,
      containmentPressure: 0.6,
      createdAt: 10,
    });

    expect(first).toEqual(second);
    expect(first.advisoryOnly).toBe(true);
  });
});
