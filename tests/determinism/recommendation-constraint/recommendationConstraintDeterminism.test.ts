import { describe, expect, it } from "vitest";
import { buildRecommendationConstraintFixture } from "@/tests/integration/recommendation-constraint/helpers";

describe("recommendation constraint determinism", () => {
  it("produces identical outputs for identical inputs", () => {
    const first = buildRecommendationConstraintFixture();
    const second = buildRecommendationConstraintFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.constrainedRecommendations[0]?.constraintHash).toBe(
      second.result.constrainedRecommendations[0]?.constraintHash,
    );
  });
});
