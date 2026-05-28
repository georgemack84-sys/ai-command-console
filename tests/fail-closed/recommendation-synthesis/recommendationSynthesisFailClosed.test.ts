import { describe, expect, it } from "vitest";
import { buildRecommendationSynthesisFixture } from "@/tests/integration/recommendation-synthesis/helpers";

describe("recommendation synthesis fail-closed", () => {
  it("freezes on governance ambiguity", () => {
    const fixture = buildRecommendationSynthesisFixture({
      constitutionalTransitionResult: Object.freeze({
        ...buildRecommendationSynthesisFixture().input.constitutionalTransitionResult,
        transition: Object.freeze({
          ...buildRecommendationSynthesisFixture().input.constitutionalTransitionResult.transition,
          governanceBasisId: "mismatched-governance",
        }),
      }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_SYNTHESIS_GOVERNANCE_AMBIGUITY")).toBe(true);
  });
});
