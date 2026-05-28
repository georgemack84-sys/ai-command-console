import { describe, expect, it } from "vitest";
import { buildRecommendationSynthesisFixture } from "@/tests/integration/recommendation-synthesis/helpers";

describe("recommendation synthesis operator authority", () => {
  it("freezes when operator suppression action is FREEZE", () => {
    const base = buildRecommendationSynthesisFixture();
    const fixture = buildRecommendationSynthesisFixture({
      operatorAuthorityResult: Object.freeze({
        ...base.input.operatorAuthorityResult,
        action: Object.freeze({
          ...base.input.operatorAuthorityResult.action,
          actionType: "FREEZE",
        }),
      }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.recommendations).toHaveLength(0);
  });
});
