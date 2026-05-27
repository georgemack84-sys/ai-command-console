import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessFixture } from "@/tests/integration/constitutional-readiness/helpers";

describe("constitutional readiness unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildConstitutionalReadinessFixture();
    const second = buildConstitutionalReadinessFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.risk).toEqual(second.result.risk);
  });

  it("does not grant authority when verified", () => {
    const fixture = buildConstitutionalReadinessFixture();

    expect(fixture.result.authorityContract.readinessAuthorization).toBe(false);
    expect(fixture.result.record.readinessClassification).toBe("VERIFIED");
  });
});
