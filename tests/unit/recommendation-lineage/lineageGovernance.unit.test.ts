import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage governance unit", () => {
  it("preserves governance binding", () => {
    const fixture = buildRecommendationLineageFixture();
    expect(fixture.result.governanceLineage.governanceBound).toBe(true);
  });
});
