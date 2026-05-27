import { describe, expect, it } from "vitest";
import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";

describe("constitutional recommendation validator determinism", () => {
  it("identical inputs produce identical admissibility outcomes", () => {
    const first = buildConstitutionalRecommendationValidationFixture();
    const second = buildConstitutionalRecommendationValidationFixture();
    expect(first.result.result.admissibility).toBe(second.result.result.admissibility);
    expect(first.result.result.auditHash).toBe(second.result.result.auditHash);
  });
});
