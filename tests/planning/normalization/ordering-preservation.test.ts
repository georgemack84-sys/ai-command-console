import { describe, expect, it } from "vitest";

import { normalizeValidatedPlan } from "@/services/planning/normalization";

import { buildValidatedNormalizationInput } from "./helpers";

describe("ordering preservation", () => {
  it("preserves 4.2B authored order", () => {
    const input = buildValidatedNormalizationInput();
    const result = normalizeValidatedPlan(input);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.normalizedPlan.steps.map((step) => step.sourceId)).toEqual(["step-a", "step-b"]);
    expect(result.normalizationEvidence.replaySnapshot.authoredStepOrder).toEqual(["step-a", "step-b"]);
  });
});

