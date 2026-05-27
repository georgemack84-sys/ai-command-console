import { describe, expect, it } from "vitest";
import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";

describe("constitutional recommendation containment unit", () => {
  it("preserves non-execution containment", () => {
    const fixture = buildConstitutionalRecommendationValidationFixture();
    expect(fixture.result.result.executable).toBe(false);
    expect(fixture.result.result.executionRiskDetected).toBe(false);
  });
});
