import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage drift unit", () => {
  it("emits zero governance mismatch metrics for clean input", () => {
    const fixture = buildRecommendationLineageFixture();
    expect(fixture.result.metrics.governanceLineageMismatches).toBe(0);
  });
});
