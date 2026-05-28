import { describe, expect, it } from "vitest";

import { normalizeValidatedPlan } from "@/services/planning/normalization";

import { buildValidatedNormalizationInput } from "./helpers";

describe("graph hash preservation", () => {
  it("preserves 4.2B graphHash exactly", () => {
    const input = buildValidatedNormalizationInput();
    const result = normalizeValidatedPlan(input);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.hashes.graphHash).toBe(input.graphHash);
    expect(result.normalizedPlan.validatedGraphHash).toBe(input.graphHash);
  });
});

