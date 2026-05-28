import { describe, expect, it } from "vitest";

import { buildSimulationLineage } from "@/services/simulation/simulationLineage";

describe("buildSimulationLineage", () => {
  it("preserves immutable forecast lineage", () => {
    const lineage = buildSimulationLineage({
      dashboard: {
        continuityConvergence: { evidence: ["event_1"] },
      } as never,
      scenario: {
        simulationType: "REPLAY",
        executionIds: ["exec_1"],
      } as never,
    });

    expect(lineage).toContain("simulation:replay");
    expect(lineage).toContain("execution:exec_1");
  });
});
