import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage replay", () => {
  it("fails closed on replay repair attacks", () => {
    const fixture = buildRecommendationLineageFixture({
      metadata: Object.freeze({ replayRepair: true, replayRepairAttack: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_LINEAGE_SYNTHETIC_ANCESTRY")).toBe(true);
  });
});
