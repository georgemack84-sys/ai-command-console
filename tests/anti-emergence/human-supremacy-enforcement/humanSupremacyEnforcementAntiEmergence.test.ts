import { describe, expect, it } from "vitest";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

describe("human supremacy enforcement anti-emergence", () => {
  it("invalidates self-preservation and hidden scheduling markers", () => {
    const fixture = buildHumanSupremacyEnforcementFixture({
      metadata: Object.freeze({ selfPreservationBehavior: true, hiddenScheduling: true }),
    });

    expect(fixture.result.record.enforcementState).toBe("INVALID");
  });
});
