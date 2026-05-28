import { describe, expect, it } from "vitest";
import { buildConstitutionalCertificationFixture } from "@/tests/integration/constitutional-certification/helpers";

describe("constitutional certification unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildConstitutionalCertificationFixture();
    const second = buildConstitutionalCertificationFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.report.reportHash).toBe(second.result.report.reportHash);
    expect(first.result.export.exportHash).toBe(second.result.export.exportHash);
  });

  it("never exposes execution, orchestration, or mutation authority", () => {
    const fixture = buildConstitutionalCertificationFixture();

    expect(fixture.result.report.executionAuthorized).toBe(false);
    expect(fixture.result.report.runtimeMutationAllowed).toBe(false);
    expect(fixture.result.report.authorityMutationAllowed).toBe(false);
    expect(fixture.result.report.governanceMutationAllowed).toBe(false);
    expect(fixture.result.report.orchestrationAllowed).toBe(false);
  });
});
