import { describe, expect, it } from "vitest";
import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";

describe("constitutional recommendation validator fail closed", () => {
  it("approval ambiguity escalates oversight", () => {
    const fixture = buildConstitutionalRecommendationValidationFixture({
      metadata: Object.freeze({ approvalAmbiguity: true }),
    });
    expect(fixture.result.result.admissibility).toBe("ESCALATED");
  });
});
