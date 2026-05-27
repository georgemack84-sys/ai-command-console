import { describe, expect, it } from "vitest";

import { buildRecommendationIntegrityFixture } from "@/tests/integration/recommendation-integrity/helpers";

describe("recommendation governance", () => {
  it("fails closed on governance detachment", () => {
    const fixture = buildRecommendationIntegrityFixture({
      metadata: Object.freeze({ bypassGovernance: true }),
    });
    expect(fixture.result.record.recommendationState).toBe("FAIL_CLOSED");
    expect(fixture.result.errors.map((error) => error.code)).toContain("RECOMMENDATION_GOVERNANCE_LINKAGE_MISSING");
  });
});
