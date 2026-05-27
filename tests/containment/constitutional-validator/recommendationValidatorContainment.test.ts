import { describe, expect, it } from "vitest";
import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";

describe("constitutional recommendation validator containment", () => {
  it("runtime linkage injection is blocked", () => {
    const fixture = buildConstitutionalRecommendationValidationFixture({
      metadata: Object.freeze({ runtimeLinked: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_VALIDATION_CONTAINMENT_INVALID")).toBe(true);
  });
});
