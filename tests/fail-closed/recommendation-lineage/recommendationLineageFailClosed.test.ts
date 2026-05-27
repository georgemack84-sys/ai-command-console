import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage fail closed", () => {
  it("freezes disputed lineage", () => {
    const fixture = buildRecommendationLineageFixture({
      metadata: Object.freeze({ lineageFrozen: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_LINEAGE_FREEZE_REQUIRED")).toBe(true);
  });
});
