import { describe, expect, it } from "vitest";

import { normalizeValidatedPlan } from "@/services/planning/normalization";
import { validatePlanStructure } from "@/services/planning/validation/validation-engine";
import { buildCanonicalPlan } from "@/tests/planning/validation/helpers";

describe("merge preservation", () => {
  it("merge semantics remain unchanged", () => {
    const base = buildCanonicalPlan();
    const mergedPlan = buildCanonicalPlan({
      steps: [
        base.steps[0]!,
        { ...base.steps[1]!, stepId: "step-b1", dependencies: ["step-a"] },
        { ...base.steps[1]!, stepId: "step-b2", dependencies: ["step-a"] },
        {
          ...base.steps[1]!,
          stepId: "step-c",
          dependencies: ["step-b1", "step-b2"],
          action: {
            tool: "inspect_runtime",
            operation: "merge",
            parameters: {
              mergePolicy: "deterministic",
              mergeSources: ["step-b1", "step-b2"],
            },
          },
        },
      ],
    });

    const validationResult = validatePlanStructure(mergedPlan);
    expect(validationResult.ok).toBe(true);

    const result = normalizeValidatedPlan({
      validatedPlan: mergedPlan,
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

    expect(result.normalizedPlan.steps[3]?.action).toEqual(mergedPlan.steps[3]?.action);
  });
});

