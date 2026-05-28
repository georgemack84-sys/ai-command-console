import { describe, expect, it } from "vitest";
import { buildConstitutionalRecommendationValidationFixture } from "./helpers";

describe("constitutional recommendation replay integration", () => {
  it("replay corruption attempt fails closed", () => {
    const fixture = buildConstitutionalRecommendationValidationFixture({
      metadata: Object.freeze({ replayCorruption: true }),
    });
    expect(fixture.result.result.replayValidated).toBe(false);
  });
});
