import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage containment unit", () => {
  it("remains advisory-only and containment-bound", () => {
    const fixture = buildRecommendationLineageFixture();
    expect(fixture.result.artifact.advisoryOnly).toBe(true);
    expect(fixture.result.artifact.executionAuthorized).toBe(false);
    expect(fixture.result.artifact.operatorReviewRequired).toBe(true);
  });
});
