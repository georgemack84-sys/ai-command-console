import { describe, expect, it } from "vitest";
import { buildOperatorAuthorityFixture } from "@/tests/integration/operator-authority/helpers";

describe("operator authority fail closed", () => {
  it("freezes under replay drift uncertainty", () => {
    const fixture = buildOperatorAuthorityFixture({
      metadata: Object.freeze({ replayDrift: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "OPERATOR_AUTHORITY_REPLAY_DRIFT"))
      .toBe(true);
    expect(fixture.result.suppression.suppressed).toBe(true);
  });
});
