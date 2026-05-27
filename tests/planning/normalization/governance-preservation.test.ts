import { describe, expect, it } from "vitest";

import { normalizeValidatedPlan } from "@/services/planning/normalization";
import { validatePlanStructure } from "@/services/planning/validation/validation-engine";

import { buildValidatedNormalizationInput } from "./helpers";

describe("governance preservation", () => {
  it("approval and governance boundaries cannot be weakened", () => {
    const input = buildValidatedNormalizationInput();
    input.validatedPlan.approvals.required = true;
    input.validatedPlan.steps[1]!.safety.approvalRequired = true;
    input.validationResult = validatePlanStructure(input.validatedPlan);
    input.replaySnapshot = input.validationResult.evidence.replaySnapshot;
    input.graphHash = input.validationResult.graphHash;
    input.validationHash = input.validationResult.validationHash;

    const result = normalizeValidatedPlan(input);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.normalizedPlan.steps[1]?.approvalMode).toBe("REQUIRED");
  });
});
