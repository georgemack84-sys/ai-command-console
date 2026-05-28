import { describe, expect, it } from "vitest";

import { validatePlanStructure } from "@/services/planning/validation/validation-engine";

import { buildCanonicalPlan } from "./helpers";

describe("ordering validation", () => {
  it("rejects ambiguous ordering", () => {
    const plan = buildCanonicalPlan({
      steps: [
        buildCanonicalPlan().steps[0],
        {
          ...buildCanonicalPlan().steps[1],
          action: {
            ...buildCanonicalPlan().steps[1].action,
            parameters: {
              parallel: true,
            },
          },
        },
      ],
    });

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "STRUCTURE_INVALID_ORDERING")).toBe(true);
  });

  it("preserves authored order", () => {
    const plan = buildCanonicalPlan();
    const result = validatePlanStructure(plan);
    expect(result.evidence.replaySnapshot.authoredStepOrder).toEqual(["step-a", "step-b"]);
  });
});

