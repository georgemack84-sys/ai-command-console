import { describe, expect, it } from "vitest";

import { validatePlanStructure } from "@/services/planning/validation/validation-engine";

import { buildCanonicalPlan } from "./helpers";

describe("dependency validation", () => {
  it("rejects a missing dependency", () => {
    const plan = buildCanonicalPlan();
    plan.steps[1].dependencies = ["step-missing"];

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "STRUCTURE_INVALID_ORDERING")).toBe(true);
    expect(result.errors.some((error) => error.code === "PLAN_SCHEMA_INVALID")).toBe(false);
  });

  it("rejects self-dependency", () => {
    const plan = buildCanonicalPlan();
    plan.steps[1].dependencies = ["step-b"];

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "STRUCTURE_CYCLE_DETECTED")).toBe(true);
  });

  it("rejects fabricated dependency", () => {
    const plan = buildCanonicalPlan();
    plan.steps[1].action.parameters = {
      dynamicDependency: "step-z",
    };

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "PLAN_NON_DETERMINISTIC")).toBe(true);
  });
});
