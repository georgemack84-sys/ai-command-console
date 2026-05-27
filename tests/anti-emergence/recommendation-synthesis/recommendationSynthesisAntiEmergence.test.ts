import { describe, expect, it } from "vitest";
import { buildRecommendationSynthesisFixture } from "@/tests/integration/recommendation-synthesis/helpers";

describe("recommendation synthesis anti-emergence", () => {
  it("freezes when operator kill-switch authority is present", () => {
    const base = buildRecommendationSynthesisFixture();
    const fixture = buildRecommendationSynthesisFixture({
      operatorAuthorityResult: Object.freeze({
        ...base.input.operatorAuthorityResult,
        action: Object.freeze({
          ...base.input.operatorAuthorityResult.action,
          actionType: "KILL_SWITCH",
        }),
      }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_SYNTHESIS_AUTHORITY_AMBIGUITY")).toBe(true);
  });
});
