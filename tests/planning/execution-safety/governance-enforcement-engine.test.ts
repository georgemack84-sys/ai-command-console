import { describe, expect, it } from "vitest";

import { enforceGovernanceSafety } from "@/services/planning/execution-safety/governance-enforcement-engine";

import { buildExecutionSafetyFixture } from "./helpers";

describe("governance enforcement engine", () => {
  it("fails closed on missing execution truth hash", () => {
    const fixture = buildExecutionSafetyFixture();
    fixture.executionTruthPackage.executionTruthHash = "";

    const governance = enforceGovernanceSafety(fixture.executionTruthPackage);
    expect(governance.allowed).toBe(false);
    expect(governance.blockedReasons).toContain("Execution truth hash missing.");
  });
});
