import { describe, expect, it } from "vitest";

import { validateRecoverySimulationConstraints } from "../../../../services/recovery/simulation/recoverySimulationConstraints";

describe("recovery simulation constraints", () => {
  it("rejects dryRun false", () => {
    const result = validateRecoverySimulationConstraints({
      simulationId: "sim-1",
      executionId: "exec-1",
      scenarioType: "CRASH_RECOVERY",
      dryRun: false as true,
      createdAt: "2026-05-08T12:00:00.000Z",
    });

    expect(result.ok).toBe(false);
  });

  it("rejects production mutation requests", () => {
    const result = validateRecoverySimulationConstraints({
      simulationId: "sim-1",
      executionId: "exec-1",
      scenarioType: "CRASH_RECOVERY",
      dryRun: true,
      createdAt: "2026-05-08T12:00:00.000Z",
      metadata: {
        productionMutationAllowed: true,
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("SIMULATION_PRODUCTION_MUTATION_FORBIDDEN");
    }
  });
});
