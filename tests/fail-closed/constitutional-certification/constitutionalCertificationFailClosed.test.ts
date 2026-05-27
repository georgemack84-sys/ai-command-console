import { describe, expect, it } from "vitest";
import { buildConstitutionalCertificationFixture } from "@/tests/integration/constitutional-certification/helpers";

describe("constitutional certification fail closed", () => {
  it("fails closed under compounded uncertainty", () => {
    const fixture = buildConstitutionalCertificationFixture({
      metadata: Object.freeze({
        governanceBypass: true,
        orchestration: true,
        authorityGrant: true,
      }),
    });

    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.report.certified).toBe(false);
    expect(fixture.result.report.operatorReviewRequired).toBe(true);
  });
});
