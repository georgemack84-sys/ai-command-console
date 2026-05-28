import { describe, expect, it } from "vitest";
import { buildOperatorAuthorityFixture } from "@/tests/integration/operator-authority/helpers";

describe("operator authority adversarial", () => {
  it("blocks kill-switch bypass attempts deterministically", () => {
    const fixture = buildOperatorAuthorityFixture({
      actionType: "KILL_SWITCH",
      metadata: Object.freeze({ killSwitchBypass: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "OPERATOR_AUTHORITY_KILL_SWITCH_BYPASS"))
      .toBe(true);
    expect(fixture.result.suppression.suppressed).toBe(true);
  });
});
