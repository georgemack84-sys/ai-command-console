import { describe, expect, it } from "vitest";

import { validateExecutionSafety } from "@/services/planning/execution-safety";

import { buildExecutionSafetyFixture } from "./helpers";

describe("execution safety validator integration", () => {
  it("consumes a valid 4.2E execution truth artifact", () => {
    const fixture = buildExecutionSafetyFixture();
    const result = validateExecutionSafety(fixture);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.contract.executionTruthHash).toBe(fixture.executionTruthPackage.executionTruthHash);
    expect(result.executionSafetyHash).toBeTruthy();
  });
});
