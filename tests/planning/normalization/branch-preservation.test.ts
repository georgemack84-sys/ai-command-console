import { describe, expect, it } from "vitest";

import { normalizeValidatedPlan } from "@/services/planning/normalization";
import { validatePlanStructure } from "@/services/planning/validation/validation-engine";
import { buildCanonicalPlan } from "@/tests/planning/validation/helpers";

describe("branch preservation", () => {
  it("branch topology remains unchanged", () => {
    const branchedPlan = buildCanonicalPlan({
      steps: [
        buildCanonicalPlan().steps[0]!,
        {
          ...buildCanonicalPlan().steps[1]!,
          stepId: "step-route",
          type: "route",
          action: {
            tool: "inspect_runtime",
            operation: "route",
            parameters: {
              branchCases: [{ condition: "always", nextStepId: "step-c" }],
            },
          },
        },
        {
          ...buildCanonicalPlan().steps[1]!,
          stepId: "step-c",
          dependencies: ["step-route"],
        },
      ],
    });
    const validationResult = validatePlanStructure(branchedPlan);
    expect(validationResult.ok).toBe(true);

    const result = normalizeValidatedPlan({
      validatedPlan: branchedPlan,
      validationResult,
      replaySnapshot: validationResult.evidence.replaySnapshot,
      graphHash: validationResult.graphHash,
      validationHash: validationResult.validationHash,
      normalizationVersion: "4.2C",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.normalizedPlan.steps[1]?.action).toEqual(branchedPlan.steps[1]?.action);
  });
});

