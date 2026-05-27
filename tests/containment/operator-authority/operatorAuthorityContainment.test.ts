import { describe, expect, it } from "vitest";
import { buildOperatorAuthorityFixture } from "@/tests/integration/operator-authority/helpers";

describe("operator authority containment", () => {
  it("fails closed when containment weakens", () => {
    const fixture = buildOperatorAuthorityFixture({
      metadata: Object.freeze({ containmentWeakening: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "OPERATOR_AUTHORITY_CONTAINMENT_INVALID"))
      .toBe(true);
  });
});
