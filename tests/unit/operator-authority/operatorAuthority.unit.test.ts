import { describe, expect, it } from "vitest";
import { buildOperatorAuthorityFixture } from "@/tests/integration/operator-authority/helpers";

describe("operator authority unit", () => {
  it("preserves advisory-only flags while suppressing recommendation continuity", () => {
    const fixture = buildOperatorAuthorityFixture();
    expect(fixture.result.action.advisoryOnly).toBe(true);
    expect(fixture.result.action.executionAuthorized).toBe(false);
    expect(fixture.result.action.executable).toBe(false);
    expect(fixture.result.action.operatorReviewRequired).toBe(true);
    expect(fixture.result.suppression.suppressed).toBe(true);
    expect(fixture.result.suppression.continuityInvalidated).toBe(true);
  });
});
