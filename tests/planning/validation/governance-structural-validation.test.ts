import { describe, expect, it } from "vitest";

import { validatePlanStructure } from "@/services/planning/validation/validation-engine";

import { buildCanonicalPlan } from "./helpers";

describe("governance structural validation", () => {
  it("rejects malformed governance", () => {
    const plan = buildCanonicalPlan({
      governance: {
        truthScoreRequired: 0.1,
        validationProfile: "default",
      },
    });

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "GOVERNANCE_FAILURE")).toBe(true);
  });

  it("rejects approval bypass", () => {
    const plan = buildCanonicalPlan({
      mission: {
        ...buildCanonicalPlan().mission,
        classification: "restricted",
      },
    });

    const result = validatePlanStructure(plan);
    expect(result.status).toBe("approval_required");
    expect(result.errors.some((error) => error.code === "PLAN_APPROVAL_MISSING")).toBe(true);
  });

  it("rejects fabricated tool", () => {
    const plan = buildCanonicalPlan();
    plan.steps[1].action.tool = "dynamic.tool";

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "PLAN_TOOL_UNKNOWN")).toBe(true);
  });
});

