import { describe, expect, it } from "vitest";

import { analyzeDegradation } from "@/services/stability/degradationAnalysis";

describe("analyzeDegradation", () => {
  it("trends stable when no degraded signals exist", () => {
    expect(analyzeDegradation({}).trend).toBe("STABLE");
  });

  it("trends declining on replay divergence", () => {
    expect(analyzeDegradation({ replayDivergence: true }).trend).toBe("DECLINING");
  });

  it("prevents stable trend when freeze is required", () => {
    expect(analyzeDegradation({ freezeRequired: true }).trend).not.toBe("STABLE");
  });

  it("prevents stable trend when truth is disputed", () => {
    expect(analyzeDegradation({ disputed: true }).trend).not.toBe("STABLE");
  });

  it("trends collapsing under severe combined signals", () => {
    expect(analyzeDegradation({
      replayDivergence: true,
      repeatedRecoveryFailures: 4,
      unresolvedEscalations: 3,
      containmentRequired: true,
      disputed: true,
      degradedDependencies: ["database", "workers", "queue"],
    }).trend).toBe("COLLAPSING");
  });
});
