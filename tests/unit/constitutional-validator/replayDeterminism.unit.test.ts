import { describe, expect, it } from "vitest";
import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";

describe("constitutional recommendation replay determinism unit", () => {
  it("identical input produces identical hashes", () => {
    const first = buildConstitutionalRecommendationValidationFixture();
    const second = buildConstitutionalRecommendationValidationFixture();
    expect(first.result.result.validationHash).toBe(second.result.result.validationHash);
    expect(first.result.result.deterministicHash).toBe(second.result.result.deterministicHash);
  });
});
