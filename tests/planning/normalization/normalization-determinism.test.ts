import { describe, expect, it } from "vitest";

import { normalizeValidatedPlan } from "@/services/planning/normalization";

import { buildValidatedNormalizationInput } from "./helpers";

describe("plan normalization determinism", () => {
  it("same input normalized repeatedly produces identical output and hashes", () => {
    const input = buildValidatedNormalizationInput();
    const left = normalizeValidatedPlan(input);
    const right = normalizeValidatedPlan(input);

    expect(left.ok).toBe(true);
    expect(right.ok).toBe(true);
    expect(left).toEqual(right);
  });
});

