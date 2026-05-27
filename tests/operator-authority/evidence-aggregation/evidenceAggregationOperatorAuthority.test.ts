import { describe, expect, it } from "vitest";
import { buildEvidenceAggregationFixture } from "@/tests/integration/evidence-aggregation/helpers";

describe("evidence aggregation operator authority", () => {
  it("does not bypass operator oversight", () => {
    const fixture = buildEvidenceAggregationFixture();
    expect(fixture.result.session.aggregationStatus).toBe("completed");
    expect(fixture.input.recommendationSynthesisInput.operatorAuthorityResult.action.operatorReviewRequired).toBe(true);
  });
});
