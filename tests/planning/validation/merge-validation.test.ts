import { describe, expect, it } from "vitest";

import { validatePlanStructure } from "@/services/planning/validation/validation-engine";

import { buildCanonicalPlan } from "./helpers";

describe("merge validation", () => {
  it("rejects an unsafe merge", () => {
    const base = buildCanonicalPlan();
    const plan = buildCanonicalPlan({
      steps: [
        base.steps[0],
        {
          ...base.steps[1],
          stepId: "step-b1",
          dependencies: ["step-a"],
        },
        {
          ...base.steps[1],
          stepId: "step-b2",
          dependencies: ["step-a"],
        },
        {
          ...base.steps[1],
          stepId: "step-c",
          dependencies: ["step-b1", "step-b2"],
          action: {
            ...base.steps[1].action,
            parameters: {},
          },
        },
      ],
    });

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "STRUCTURE_UNSAFE_MERGE")).toBe(true);
  });

  it("rejects a merge conflict", () => {
    const base = buildCanonicalPlan();
    const plan = buildCanonicalPlan({
      steps: [
        base.steps[0],
        {
          ...base.steps[1],
          stepId: "step-b1",
          dependencies: ["step-a"],
        },
        {
          ...base.steps[1],
          stepId: "step-b2",
          dependencies: ["step-a"],
        },
        {
          ...base.steps[1],
          stepId: "step-c",
          dependencies: ["step-b1", "step-b2"],
          action: {
            ...base.steps[1].action,
            parameters: {
              mergePolicy: "manual",
              mergeSources: ["step-b1"],
            },
          },
        },
      ],
    });

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "STRUCTURE_UNSAFE_MERGE")).toBe(true);
  });
});

