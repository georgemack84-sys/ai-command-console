import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage anti-emergence", () => {
  it("rejects orchestration-linked ancestry", () => {
    const fixture = buildRecommendationLineageFixture({
      metadata: Object.freeze({ orchestrationLinked: true, recommendationTriggeredOrchestration: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_LINEAGE_ORCHESTRATION_LINKED")).toBe(true);
  });
});
