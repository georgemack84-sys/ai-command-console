import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage fail-closed unit", () => {
  it("fails closed on missing evidence ancestry", () => {
    const fixture = buildRecommendationLineageFixture({
      evidenceSnapshots: Object.freeze([]),
    });
    expect(fixture.result.errors.length).toBeGreaterThan(0);
  });
});
