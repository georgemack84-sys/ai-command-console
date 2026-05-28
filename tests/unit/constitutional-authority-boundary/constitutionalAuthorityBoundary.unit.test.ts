import { describe, expect, it } from "vitest";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";

describe("constitutional authority boundary unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildConstitutionalAuthorityBoundaryFixture();
    const second = buildConstitutionalAuthorityBoundaryFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.lineageValidation).toEqual(second.result.lineageValidation);
  });

  it("keeps authority classes immutable and bounded", () => {
    const fixture = buildConstitutionalAuthorityBoundaryFixture();

    expect(fixture.result.authorityClasses.map((item) => item.authorityClass)).toEqual(["A0", "A1", "A2", "A3", "A4"]);
  });
});
