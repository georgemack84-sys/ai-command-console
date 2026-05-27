import { describe, expect, it } from "vitest";
import { buildConstitutionalRuntimeSimulationFixture } from "@/tests/integration/constitutional-runtime-simulation/helpers";

describe("constitutional runtime simulation unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildConstitutionalRuntimeSimulationFixture();
    const second = buildConstitutionalRuntimeSimulationFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.report.simulationTraceHash).toBe(second.result.report.simulationTraceHash);
    expect(first.result.export.exportHash).toBe(second.result.export.exportHash);
  });

  it("never exposes execution, scheduling, or mutation authority", () => {
    const fixture = buildConstitutionalRuntimeSimulationFixture();

    expect(fixture.result.report.executable).toBe(false);
    expect(fixture.result.report.schedulingAllowed).toBe(false);
    expect(fixture.result.report.runtimeMutationAllowed).toBe(false);
    expect(fixture.result.report.authorityMutationAllowed).toBe(false);
  });
});
