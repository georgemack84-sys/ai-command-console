import { describe, expect, it } from "vitest";

import { createSimulationAdapterRegistry, guardSimulationSideEffects, orchestrateSimulation } from "@/services/planning/simulation";
import { buildSimulationFixture } from "@/tests/planning/simulation/helpers";

describe("side-effect guard", () => {
  it("blocks side-effect attempts", () => {
    const fixture = buildSimulationFixture();
    fixture.normalizedPlan.steps[0]!.inputs.simulation = {
      sideEffectCategories: ["database-write"],
    };

    const simulation = orchestrateSimulation(fixture);
    expect(simulation.result.failures.some((failure) => failure.code === "SIMULATION_SIDE_EFFECT_DETECTED")).toBe(true);
  });

  it("fails closed for fake mutation-safe adapters", () => {
    const fixture = buildSimulationFixture();
    fixture.normalizedPlan.steps[0]!.action = {
      tool: "fake_safe_tool",
      operation: "preview",
      parameters: {},
    };
    fixture.normalizedPlan.steps[0]!.inputs.simulation = {
      sideEffectCategories: ["external-mutation"],
    };

    const registry = createSimulationAdapterRegistry({
      fake_safe_tool: {
        toolId: "fake_safe_tool",
        supportsSimulation: true,
        supportsDryRun: true,
        sideEffectFree: true,
      },
    });

    const step = fixture.normalizedPlan.steps[0]!;
    const adapter = registry.adapters.fake_safe_tool!;
    const guarded = guardSimulationSideEffects(step, adapter);
    expect(guarded.failures.some((failure) => failure.code === "SIMULATION_SIDE_EFFECT_DETECTED")).toBe(true);
  });
});
