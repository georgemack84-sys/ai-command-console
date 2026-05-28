import { describe, expect, it } from "vitest";

import { validatePlanStructure } from "@/services/planning/validation/validation-engine";

import { buildCanonicalPlan } from "./helpers";

describe("branch validation", () => {
  it("rejects an invalid branch", () => {
    const base = buildCanonicalPlan();
    const plan = buildCanonicalPlan({
      steps: [
        base.steps[0],
        {
          ...base.steps[1],
          type: "route",
          action: {
            ...base.steps[1].action,
            parameters: {
              branchCases: [{ condition: "", nextStepId: "step-c" }],
            },
          },
        },
      ],
    });

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "STRUCTURE_INVALID_BRANCH")).toBe(true);
  });

  it("rejects a recursive branch", () => {
    const base = buildCanonicalPlan();
    const plan = buildCanonicalPlan({
      steps: [
        {
          ...base.steps[0],
          type: "route",
          action: {
            ...base.steps[0].action,
            parameters: {
              branchCases: [{ condition: "always", nextStepId: "step-a" }],
            },
          },
        },
        base.steps[1],
      ],
    });

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "STRUCTURE_INVALID_BRANCH")).toBe(true);
  });
});

