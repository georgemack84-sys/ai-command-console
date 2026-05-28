import { describe, expect, it } from "vitest";

import { simulateDegradationPropagation } from "@/services/simulation/degradationPropagationSimulation";

describe("simulateDegradationPropagation", () => {
  it("projects degraded subsystems into propagation output", () => {
    const result = simulateDegradationPropagation({
      scenario: { simulationType: "DEGRADATION_PROPAGATION", disputed: false, frozen: false } as never,
      input: {
        dashboard: {
          degradedSystems: ["queue", "workers"],
          continuityConvergence: { divergenceScore: 0.6 },
          operationalStabilityAssessment: { survivabilityScore: 0.4, escalationPressure: 0.5, continuityConfidence: 0.5 },
          stewardship: { survivabilityScore: 0.45 },
        },
      } as never,
    });

    expect(result.projectedSubsystemFailures).toContain("queue");
  });
});
