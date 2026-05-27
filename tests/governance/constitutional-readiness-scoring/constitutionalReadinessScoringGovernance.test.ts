import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessScoringFixture } from "@/tests/integration/constitutional-readiness-scoring/helpers";

describe("constitutional readiness scoring governance", () => {
  it("fails closed when governance drifts or detaches", () => {
    const base = buildConstitutionalReadinessScoringFixture();
    const fixture = buildConstitutionalReadinessScoringFixture({
      runtimeAdmissibilityResult: {
        ...base.input.runtimeAdmissibilityResult,
        governanceCheck: {
          ...base.input.runtimeAdmissibilityResult.governanceCheck,
          detached: true,
          governanceBound: false,
        },
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_READINESS_GOVERNANCE_BINDING_INVALID")).toBe(true);
    expect(fixture.result.report.operatorReviewRequired).toBe(true);
  });
});
