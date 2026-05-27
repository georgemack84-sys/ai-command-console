import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessScoringFixture } from "@/tests/integration/constitutional-readiness-scoring/helpers";

describe("constitutional readiness scoring fail closed", () => {
  it("increases oversight and freezes when uncertainty compounds", () => {
    const fixture = buildConstitutionalReadinessScoringFixture({
      metadata: Object.freeze({
        authorityGrant: true,
        staleGovernance: true,
        orchestration: true,
      }),
    });

    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.report.readinessClassification).toBe("FROZEN");
    expect(fixture.result.report.operatorReviewRequired).toBe(true);
  });
});
