import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage governance", () => {
  it("fails closed on governance substitution attacks", () => {
    const fixture = buildRecommendationLineageFixture({
      metadata: Object.freeze({ governanceSubstitution: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_LINEAGE_GOVERNANCE_MISMATCH")).toBe(true);
  });
});
