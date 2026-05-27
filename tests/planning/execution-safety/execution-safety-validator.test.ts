import { describe, expect, it } from "vitest";

import { validateExecutionSafety } from "@/services/planning/execution-safety";

import { buildExecutionSafetyFixture } from "./helpers";

describe("execution safety validator", () => {
  it("requires approval for approval-required plans instead of marking them SAFE", () => {
    const fixture = buildExecutionSafetyFixture();
    fixture.executionTruthPackage.governanceEnvelope.requiredApprovals = ["production"];

    const result = validateExecutionSafety(fixture);
    expect(result.ok).toBe(false);
    expect(result.state).toBe("APPROVAL_REQUIRED");
  });

  it("fails closed when governance envelope is missing", () => {
    const fixture = buildExecutionSafetyFixture();
    fixture.executionTruthPackage.governanceEnvelope = undefined as never;

    const result = validateExecutionSafety(fixture);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.violations.some((violation) => violation.code === "EXECUTION_GOVERNANCE_MISSING")).toBe(true);
  });
});
