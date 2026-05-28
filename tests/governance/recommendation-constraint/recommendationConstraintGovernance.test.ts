import { describe, expect, it } from "vitest";
import { buildRecommendationConstraintFixture } from "@/tests/integration/recommendation-constraint/helpers";

describe("recommendation constraint governance enforcement", () => {
  it("freezes on governance mismatch", () => {
    const base = buildRecommendationConstraintFixture();
    const fixture = buildRecommendationConstraintFixture({
      recommendationSynthesisInput: Object.freeze({
        ...base.input.recommendationSynthesisInput,
        constitutionalTransitionResult: Object.freeze({
          ...base.input.recommendationSynthesisInput.constitutionalTransitionResult,
          transition: Object.freeze({
            ...base.input.recommendationSynthesisInput.constitutionalTransitionResult.transition,
            governanceBasisId: "mismatched-governance",
          }),
        }),
      }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_CONSTRAINT_GOVERNANCE_AMBIGUITY")).toBe(true);
  });
});
