import { describe, expect, it } from "vitest";

import { getRecoverySimulationScenario, listRecoverySimulationScenarios } from "../../../../services/recovery/simulation/recoveryScenarioLibrary";

describe("recovery scenario library", () => {
  it("lists supported scenarios deterministically", () => {
    const scenarios = listRecoverySimulationScenarios();
    expect(scenarios.map((scenario) => scenario.type)).toContain("CRASH_RECOVERY");
    expect(scenarios.map((scenario) => scenario.type)).toContain("PARTIAL_EXECUTION_RECOVERY");
  });

  it("rejects unknown scenario types", () => {
    expect(() => getRecoverySimulationScenario("NOT_A_REAL_SCENARIO" as never)).toThrowError(/Unknown recovery simulation scenario/);
  });
});
