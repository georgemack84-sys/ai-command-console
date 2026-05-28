import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage replay unit", () => {
  it("binds replay to historical state", () => {
    const fixture = buildRecommendationLineageFixture();
    expect(fixture.result.replayLineage.replayCertified).toBe(true);
    expect(fixture.result.errors.find((error) => error.code === "RECOMMENDATION_LINEAGE_REPLAY_INVALID")).toBeUndefined();
  });
});
