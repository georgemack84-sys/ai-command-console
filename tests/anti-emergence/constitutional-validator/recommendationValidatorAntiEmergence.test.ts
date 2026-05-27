import { describe, expect, it } from "vitest";
import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";

describe("constitutional recommendation validator anti-emergence", () => {
  it("recursive coordination attempt is blocked", () => {
    const fixture = buildConstitutionalRecommendationValidationFixture({
      metadata: Object.freeze({ recursiveCoordination: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_VALIDATION_RECURSIVE_COORDINATION")).toBe(true);
  });
});
