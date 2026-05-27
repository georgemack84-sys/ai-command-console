import { describe, expect, it } from "vitest";

import { evaluateSimulationConstraints } from "@/services/simulation/simulationConstraints";

describe("simulation read-only enforcement", () => {
  it("marks simulations as deterministic and read-only", () => {
    const result = evaluateSimulationConstraints({
      dashboard: null,
      simulationType: "governance_conflict",
    });

    expect(result.readOnly).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.allowed).toBe(false);
  });
});
