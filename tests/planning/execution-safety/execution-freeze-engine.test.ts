import { describe, expect, it } from "vitest";

import { determineExecutionFreezeReasons } from "@/services/planning/execution-safety/execution-freeze-engine";

import { buildExecutionSafetyFixture } from "./helpers";
import { buildExecutionSafetyContract } from "@/services/planning/execution-safety";

describe("execution freeze engine", () => {
  it("requires freeze on containment violations and missing rollback capability", () => {
    const fixture = buildExecutionSafetyFixture();
    fixture.executionTruthPackage.riskProfile.stepSignals[0] = {
      ...fixture.executionTruthPackage.riskProfile.stepSignals[0]!,
      destructive: true,
      rollbackCapability: "none",
      targetEnvironment: "production",
    };
    const built = buildExecutionSafetyContract(fixture);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const reasons = determineExecutionFreezeReasons({
      ...built.contract,
      containmentZone: "CROSS_TENANT_FORBIDDEN",
      freezeReasons: [],
    });
    expect(reasons).toEqual(expect.arrayContaining(["ROLLBACK_MISSING", "CONTAINMENT_VIOLATION"]));
  });
});
