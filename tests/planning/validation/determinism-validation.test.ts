import { describe, expect, it } from "vitest";

import { validatePlanStructure } from "@/services/planning/validation/validation-engine";

import { buildCanonicalPlan } from "./helpers";

describe("determinism validation", () => {
  it("same input returns same validation result", () => {
    const plan = buildCanonicalPlan();
    const left = validatePlanStructure(plan);
    const right = validatePlanStructure(plan);

    expect(left).toEqual(right);
  });

  it("deterministic replay hash is stable", () => {
    const plan = buildCanonicalPlan();
    expect(validatePlanStructure(plan).graphHash).toBe(validatePlanStructure(plan).graphHash);
  });

  it("rejects mutable timestamp-like structural field", () => {
    const plan = buildCanonicalPlan();
    plan.steps[1].action.parameters = {
      generatedAt: "$now",
    };

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "PLAN_NON_DETERMINISTIC")).toBe(true);
  });
});

