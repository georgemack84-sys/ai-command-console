import { describe, expect, it } from "vitest";
import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";

describe("constitutional recommendation fail closed unit", () => {
  it("governance ambiguity escalates or disputes", () => {
    const fixture = buildConstitutionalRecommendationValidationFixture({
      metadata: Object.freeze({ governanceBypass: true }),
    });
    expect(fixture.result.result.admissibility).toBe("DISPUTED");
  });
});
