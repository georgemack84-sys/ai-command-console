import { describe, expect, it } from "vitest";
import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";

describe("constitutional recommendation validator unit", () => {
  it("validates admissible recommendations as advisory-only", () => {
    const fixture = buildConstitutionalRecommendationValidationFixture();
    expect(fixture.result.result.advisoryOnly).toBe(true);
    expect(fixture.result.result.executionAuthorized).toBe(false);
    expect(fixture.result.result.operatorReviewRequired).toBe(true);
  });
});
