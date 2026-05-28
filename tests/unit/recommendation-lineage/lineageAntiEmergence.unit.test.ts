import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage anti-emergence unit", () => {
  it("rejects runtime-linked ancestry", () => {
    const fixture = buildRecommendationLineageFixture({
      metadata: Object.freeze({ runtimeLinked: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_LINEAGE_RUNTIME_LINKED")).toBe(true);
  });
});
