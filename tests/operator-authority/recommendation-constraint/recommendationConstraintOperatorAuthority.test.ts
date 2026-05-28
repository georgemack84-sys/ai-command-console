import { describe, expect, it } from "vitest";
import { buildRecommendationConstraintFixture } from "@/tests/integration/recommendation-constraint/helpers";

describe("recommendation constraint operator supremacy", () => {
  it("blocks suppressed recommendations from surviving into constrained output", () => {
    const base = buildRecommendationConstraintFixture();
    const fixture = buildRecommendationConstraintFixture({
      recommendationSynthesisInput: Object.freeze({
        ...base.input.recommendationSynthesisInput,
        operatorAuthorityResult: Object.freeze({
          ...base.input.recommendationSynthesisInput.operatorAuthorityResult,
          action: Object.freeze({
            ...base.input.recommendationSynthesisInput.operatorAuthorityResult.action,
            actionType: "FREEZE",
          }),
        }),
      }),
    });

    expect(fixture.result.freeze.blocked).toBe(true);
    expect(fixture.result.constrainedRecommendations).toHaveLength(0);
  });
});
