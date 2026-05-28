import { describe, expect, it } from "vitest";
import { buildConstitutionalCertificationFixture } from "@/tests/integration/constitutional-certification/helpers";

describe("constitutional certification integration", () => {
  it("builds an advisory-only certification report with immutable lineage", () => {
    const fixture = buildConstitutionalCertificationFixture();

    expect(fixture.result.report.advisoryOnly).toBe(true);
    expect(fixture.result.report.executionAuthorized).toBe(false);
    expect(fixture.result.report.operatorReviewRequired).toBe(true);
    expect(fixture.result.lineage.entries.length).toBe(1);
    expect(fixture.result.replayLedger.length).toBe(2);
  });
});
