import { describe, expect, it } from "vitest";
import { buildOperatorAuthorityFixture } from "@/tests/integration/operator-authority/helpers";

describe("operator authority anti-emergence", () => {
  it("blocks hidden authority restoration attempts", () => {
    const fixture = buildOperatorAuthorityFixture({
      metadata: Object.freeze({ hiddenAuthorityRestoration: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "OPERATOR_AUTHORITY_HIDDEN_RESTORATION"))
      .toBe(true);
  });
});
