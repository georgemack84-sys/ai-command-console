import { describe, expect, it } from "vitest";
import { buildConfidenceScoringFixture } from "@/tests/integration/confidence-scoring/helpers";

describe("confidence scoring anti-emergence", () => {
  it("freezes on hidden execution implication in constrained recommendations", () => {
    const base = buildConfidenceScoringFixture();
    const fixture = buildConfidenceScoringFixture({
      recommendationConstraintResult: Object.freeze({
        ...base.input.recommendationConstraintResult,
        constrainedRecommendations: Object.freeze(
          base.input.recommendationConstraintResult.constrainedRecommendations.map((item) =>
            Object.freeze({
              ...item,
              constrainedRecommendation: Object.freeze({
                ...item.constrainedRecommendation,
                summary: `execute ${item.constrainedRecommendation.summary}`,
              }),
            }),
          ),
        ),
      }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "CONFIDENCE_SCORING_HIDDEN_EXECUTION")).toBe(true);
  });
});
