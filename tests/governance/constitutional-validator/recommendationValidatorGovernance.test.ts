import { describe, expect, it } from "vitest";
import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";

describe("constitutional recommendation validator governance", () => {
  it("governance bypass attempt fails closed", () => {
    const fixture = buildConstitutionalRecommendationValidationFixture({
      metadata: Object.freeze({ governanceBypass: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_VALIDATION_GOVERNANCE_DRIFT")).toBe(true);
  });
});
