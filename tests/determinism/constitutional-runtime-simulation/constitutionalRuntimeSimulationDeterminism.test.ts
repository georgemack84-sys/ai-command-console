import { describe, expect, it } from "vitest";
import { buildConstitutionalRuntimeSimulationFixture } from "@/tests/integration/constitutional-runtime-simulation/helpers";

describe("constitutional runtime simulation determinism", () => {
  it("keeps scenario traces stable for identical inputs", () => {
    const first = buildConstitutionalRuntimeSimulationFixture();
    const second = buildConstitutionalRuntimeSimulationFixture();

    expect(first.result.scenarioTraces.map((trace) => trace.traceHash)).toEqual(
      second.result.scenarioTraces.map((trace) => trace.traceHash),
    );
  });
});
