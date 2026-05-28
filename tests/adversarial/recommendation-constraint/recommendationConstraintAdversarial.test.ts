import { describe, expect, it } from "vitest";
import { buildRecommendationConstraintFixture } from "@/tests/integration/recommendation-constraint/helpers";

describe("recommendation constraint adversarial cases", () => {
  it("blocks execution implication language", () => {
    const base = buildRecommendationConstraintFixture();
    const fixture = buildRecommendationConstraintFixture({
      recommendationSynthesisResult: Object.freeze({
        ...base.input.recommendationSynthesisResult,
        recommendations: Object.freeze(base.input.recommendationSynthesisResult.recommendations.map((item) =>
          Object.freeze({
            ...item,
            recommendation: Object.freeze({
              ...item.recommendation,
              summary: `execute ${item.recommendation.summary}`,
            }),
          }),
        )),
      }),
    });

    expect(fixture.result.freeze.blocked).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_CONSTRAINT_EXECUTION_SEMANTIC")).toBe(true);
  });
});
