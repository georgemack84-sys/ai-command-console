import { describe, expect, it } from "vitest";

import { isAllowedPlanTransition } from "@/services/plans/planTransitionMatrix";

describe("planTransitionMatrix", () => {
  it("allows documented transitions and denies unknown ones", () => {
    expect(isAllowedPlanTransition("DRAFT", "VALIDATING")).toBe(true);
    expect(isAllowedPlanTransition("EXECUTING", "PAUSED")).toBe(true);
    expect(isAllowedPlanTransition("FAILED", "DISPUTED")).toBe(true);
    expect(isAllowedPlanTransition("PAUSED", "VALIDATED")).toBe(false);
    expect(isAllowedPlanTransition("COMPLETED", "QUEUED")).toBe(false);
  });
});
