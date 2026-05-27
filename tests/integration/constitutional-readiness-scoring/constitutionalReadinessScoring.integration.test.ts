import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessScoringFixture } from "@/tests/integration/constitutional-readiness-scoring/helpers";

describe("constitutional readiness scoring integration", () => {
  it("builds an advisory-only readiness report with immutable lineage", () => {
    const fixture = buildConstitutionalReadinessScoringFixture();

    expect(fixture.result.report.advisoryOnly).toBe(true);
    expect(fixture.result.report.executable).toBe(false);
    expect(fixture.result.report.operatorReviewRequired).toBe(true);
    expect(fixture.result.lineage.entries.length).toBe(1);
    expect(fixture.result.replayLedger.length).toBe(2);
  });
});
