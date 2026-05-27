import { describe, expect, it } from "vitest";
import { buildRecommendationConstraintFixture } from "@/tests/integration/recommendation-constraint/helpers";

describe("recommendation constraint fail-closed behavior", () => {
  it("freezes when evidence aggregation is already frozen", () => {
    const base = buildRecommendationConstraintFixture();
    const fixture = buildRecommendationConstraintFixture({
      evidenceAggregationResult: Object.freeze({
        ...base.input.evidenceAggregationResult,
        freeze: Object.freeze({
          ...base.input.evidenceAggregationResult.freeze,
          frozen: true,
        }),
      }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_CONSTRAINT_CONSTRAINT_CORRUPTION")).toBe(true);
  });
});
