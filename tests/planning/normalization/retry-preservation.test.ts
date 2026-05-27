import { describe, expect, it } from "vitest";

import { normalizeValidatedPlan } from "@/services/planning/normalization";
import { validatePlanStructure } from "@/services/planning/validation/validation-engine";

import { buildValidatedNormalizationInput } from "./helpers";

describe("retry preservation", () => {
  it("retry semantics remain unchanged", () => {
    const input = buildValidatedNormalizationInput();
    input.validatedPlan.execution.retryPolicy = {
      maxAttempts: 2,
      backoffMs: 1000,
    };
    input.validationResult = validatePlanStructure(input.validatedPlan);
    input.replaySnapshot = input.validationResult.evidence.replaySnapshot;
    input.graphHash = input.validationResult.graphHash;
    input.validationHash = input.validationResult.validationHash;

    const result = normalizeValidatedPlan(input);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.normalizedPlan.steps[1]?.retryMode).toBe("SAFE_ONLY");
  });
});
