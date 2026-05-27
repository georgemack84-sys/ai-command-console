import { describe, expect, it } from "vitest";
import { buildRecommendationConstraintFixture } from "@/tests/integration/recommendation-constraint/helpers";

describe("recommendation constraint anti-emergence", () => {
  it("blocks hidden orchestration language", () => {
    const base = buildRecommendationConstraintFixture();
    const fixture = buildRecommendationConstraintFixture({
      recommendationSynthesisResult: Object.freeze({
        ...base.input.recommendationSynthesisResult,
        recommendations: Object.freeze(base.input.recommendationSynthesisResult.recommendations.map((item) =>
          Object.freeze({
            ...item,
            recommendation: Object.freeze({
              ...item.recommendation,
              rationale: `${item.recommendation.rationale} automatically dispatch when safe`,
            }),
          }),
        )),
      }),
    });

    expect(fixture.result.freeze.blocked).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_CONSTRAINT_HIDDEN_ORCHESTRATION")).toBe(true);
  });
});
