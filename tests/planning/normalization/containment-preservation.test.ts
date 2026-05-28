import { describe, expect, it } from "vitest";

import { normalizeValidatedPlan } from "@/services/planning/normalization";

import { buildValidatedNormalizationInput } from "./helpers";

describe("containment preservation", () => {
  it("containment guarantees cannot be weakened", () => {
    const input = buildValidatedNormalizationInput();
    const result = normalizeValidatedPlan(input);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.normalizedPlan.steps.every((step) => step.containmentLevel === "STRICT")).toBe(true);
  });
});

