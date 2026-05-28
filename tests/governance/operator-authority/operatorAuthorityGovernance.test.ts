import { describe, expect, it } from "vitest";
import { buildOperatorAuthorityFixture } from "@/tests/integration/operator-authority/helpers";

describe("operator authority governance", () => {
  it("fails closed when governance drift appears in suppression flow", () => {
    const fixture = buildOperatorAuthorityFixture({
      metadata: Object.freeze({ governanceDrift: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "OPERATOR_AUTHORITY_GOVERNANCE_DRIFT"))
      .toBe(true);
  });
});
