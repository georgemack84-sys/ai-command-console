import { describe, expect, it } from "vitest";

import { enforceRollbackSafety } from "@/services/planning/execution-safety/rollback-enforcement-engine";

import { buildExecutionSafetyFixture } from "./helpers";

describe("rollback enforcement engine", () => {
  it("fails closed when mutation requires rollback but rollback capability is missing", () => {
    const fixture = buildExecutionSafetyFixture();
    fixture.executionTruthPackage.riskProfile.stepSignals[0] = {
      ...fixture.executionTruthPackage.riskProfile.stepSignals[0]!,
      destructive: true,
      rollbackCapability: "none",
    };

    const rollback = enforceRollbackSafety(fixture.executionTruthPackage);
    expect(rollback.required).toBe(true);
    expect(rollback.invariants.some((invariant) => invariant.satisfied === false)).toBe(true);
  });
});
