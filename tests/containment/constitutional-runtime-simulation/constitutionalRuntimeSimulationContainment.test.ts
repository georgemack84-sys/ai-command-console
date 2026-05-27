import { describe, expect, it } from "vitest";
import { buildConstitutionalRuntimeSimulationFixture } from "@/tests/integration/constitutional-runtime-simulation/helpers";

describe("constitutional runtime simulation containment", () => {
  it("keeps containment pressure advisory-only", () => {
    const fixture = buildConstitutionalRuntimeSimulationFixture({
      metadata: Object.freeze({ containmentPressure: "high" }),
    });

    expect(fixture.result.report.authorityStatus).toBe("MODELED_ONLY");
    expect(fixture.result.report.governanceMutationAllowed).toBe(false);
  });
});
