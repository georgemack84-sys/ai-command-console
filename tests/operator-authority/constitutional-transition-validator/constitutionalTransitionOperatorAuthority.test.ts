import { describe, expect, it } from "vitest";
import { buildConstitutionalTransitionFixture } from "@/tests/integration/constitutional-transition-validator/helpers";

describe("constitutional transition operator authority", () => {
  it("retains operator-compatible controls", () => {
    const fixture = buildConstitutionalTransitionFixture();

    expect(fixture.result.compatibility.pauseAvailable).toBe(true);
    expect(fixture.result.compatibility.freezeAvailable).toBe(true);
    expect(fixture.result.compatibility.emergencyStopAvailable).toBe(true);
    expect(fixture.result.transition.executionAuthorized).toBe(false);
  });
});
