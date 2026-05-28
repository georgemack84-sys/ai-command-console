import { describe, expect, it } from "vitest";
import { buildConstitutionalRuntimeSimulationFixture } from "@/tests/integration/constitutional-runtime-simulation/helpers";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

describe("constitutional runtime simulation supremacy", () => {
  it("propagates operator review immediately", () => {
    const supremacy = buildHumanSupremacyEnforcementFixture({
      interventionType: "kill_switch",
    }).result;
    const fixture = buildConstitutionalRuntimeSimulationFixture({
      humanSupremacyResult: supremacy,
    });

    expect(fixture.result.report.operatorReviewRequired).toBe(true);
    expect(fixture.result.scenarioTraces.some((trace) => trace.operatorReviewRequired)).toBe(true);
  });
});
