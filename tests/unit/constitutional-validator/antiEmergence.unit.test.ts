import { describe, expect, it } from "vitest";
import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";

describe("constitutional recommendation anti-emergence unit", () => {
  it("blocks execution semantics", () => {
    const fixture = buildConstitutionalRecommendationValidationFixture({
      metadata: Object.freeze({ executionPayload: true }),
    });
    expect(fixture.result.result.admissibility).toBe("BLOCKED");
  });
});
