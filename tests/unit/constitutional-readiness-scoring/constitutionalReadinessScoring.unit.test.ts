import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessScoringFixture } from "@/tests/integration/constitutional-readiness-scoring/helpers";

describe("constitutional readiness scoring unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildConstitutionalReadinessScoringFixture();
    const second = buildConstitutionalReadinessScoringFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.report.reportHash).toBe(second.result.report.reportHash);
    expect(first.result.export.exportHash).toBe(second.result.export.exportHash);
  });

  it("never exposes execution, orchestration, or mutation authority", () => {
    const fixture = buildConstitutionalReadinessScoringFixture();

    expect(fixture.result.report.executable).toBe(false);
    expect(fixture.result.report.runtimeMutationAllowed).toBe(false);
    expect(fixture.result.report.authorityMutationAllowed).toBe(false);
    expect(fixture.result.report.governanceMutationAllowed).toBe(false);
    expect(fixture.result.report.orchestrationAllowed).toBe(false);
  });
});
