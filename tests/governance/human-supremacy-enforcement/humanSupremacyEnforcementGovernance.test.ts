import { describe, expect, it } from "vitest";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

describe("human supremacy enforcement governance", () => {
  it("fails closed on governance detachment", () => {
    const fixture = buildHumanSupremacyEnforcementFixture({
      metadata: Object.freeze({ governanceDetachment: true }),
    });

    expect(["DISPUTED", "FROZEN", "REVOKED", "INVALID"]).toContain(fixture.result.record.enforcementState);
    expect(fixture.result.record.failClosed).toBe(true);
  });
});
