import { describe, expect, it } from "vitest";
import { buildConstitutionalRuntimeSimulationFixture } from "@/tests/integration/constitutional-runtime-simulation/helpers";

describe("constitutional runtime simulation adversarial", () => {
  it("rejects authority crossover and hidden orchestration markers", () => {
    const fixture = buildConstitutionalRuntimeSimulationFixture({
      metadata: Object.freeze({
        authorityGrant: true,
        orchestration: true,
      }),
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_RUNTIME_SIMULATION_AUTHORITY_CROSSOVER")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_RUNTIME_SIMULATION_ISOLATION_VIOLATION")).toBe(true);
  });
});
