import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessScoringFixture } from "@/tests/integration/constitutional-readiness-scoring/helpers";

describe("constitutional readiness scoring supremacy", () => {
  it("fails closed when override propagation degrades", () => {
    const base = buildConstitutionalReadinessScoringFixture();
    const fixture = buildConstitutionalReadinessScoringFixture({
      humanSupremacyResult: {
        ...base.input.humanSupremacyResult,
        overridePropagation: {
          ...base.input.humanSupremacyResult.overridePropagation,
          globallyPropagated: false,
          propagationState: "partial",
        },
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_READINESS_OVERRIDE_PROPAGATION_FAILED")).toBe(true);
    expect(fixture.result.report.operatorReviewRequired).toBe(true);
  });
});
