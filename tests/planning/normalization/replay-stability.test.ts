import { describe, expect, it } from "vitest";

import { normalizeValidatedPlan } from "@/services/planning/normalization";

import { buildValidatedNormalizationInput } from "./helpers";

describe("replay stability", () => {
  it("replay snapshot remains stable and replay hash matches", () => {
    const input = buildValidatedNormalizationInput();
    const result = normalizeValidatedPlan(input);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.hashes.replayHash).toBe(result.normalizationEvidence.replayHash);
    expect(result.normalizationEvidence.replaySnapshot).toEqual(input.replaySnapshot);
  });
});

