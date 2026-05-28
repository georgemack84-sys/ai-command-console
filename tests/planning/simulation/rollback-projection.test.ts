import { describe, expect, it } from "vitest";

import { buildRollbackProjection } from "@/services/planning/simulation";
import { buildSimulationFixture } from "@/tests/planning/simulation/helpers";

describe("rollback projection", () => {
  it("surfaces rollback invalidity", () => {
    const fixture = buildSimulationFixture();
    fixture.normalizedPlan.steps[1]!.inputs.isDestructive = true;
    (fixture.executionCompatibilityContract as { rollbackContracts: unknown[] }).rollbackContracts = [];

    const projection = buildRollbackProjection(
      fixture.normalizedPlan,
      fixture.executionCompatibilityContract,
    );

    expect(projection.failures.some((failure) => failure.code === "SIMULATION_ROLLBACK_INVALID")).toBe(true);
  });
});
