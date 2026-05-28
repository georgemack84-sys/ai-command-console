import { describe, expect, it } from "vitest";
import { buildConstitutionalCertificationFixture } from "@/tests/integration/constitutional-certification/helpers";

describe("constitutional certification governance", () => {
  it("fails closed when governance detaches", () => {
    const base = buildConstitutionalCertificationFixture();
    const fixture = buildConstitutionalCertificationFixture({
      runtimeAdmissibilityResult: {
        ...base.input.runtimeAdmissibilityResult,
        governanceCheck: {
          ...base.input.runtimeAdmissibilityResult.governanceCheck,
          detached: true,
          governanceBound: false,
        },
      },
    });

    expect(fixture.result.report.decision).toBe("GOVERNANCE_FAILURE");
    expect(fixture.result.report.operatorReviewRequired).toBe(true);
  });
});
