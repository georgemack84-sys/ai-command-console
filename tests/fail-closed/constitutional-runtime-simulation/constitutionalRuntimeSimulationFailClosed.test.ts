import { describe, expect, it } from "vitest";
import { buildConstitutionalRuntimeSimulationFixture } from "@/tests/integration/constitutional-runtime-simulation/helpers";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";

describe("constitutional runtime simulation fail-closed", () => {
  it("fails closed on recursive coordination", () => {
    const antiEmergence = buildAntiEmergenceFixture({
      metadata: Object.freeze({ recursiveCoordination: true }),
    }).result;
    const fixture = buildConstitutionalRuntimeSimulationFixture({
      antiEmergenceResult: antiEmergence,
    });

    expect(fixture.result.signals.some((signal) => signal.domain === "coordination_stress" && signal.triggered)).toBe(true);
    expect(fixture.result.report.outcome).toBe("FAILED_CLOSED");
  });
});
