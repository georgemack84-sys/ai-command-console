import { describe, expect, it } from "vitest";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

describe("human supremacy enforcement fail-closed", () => {
  it("freezes on containment degradation", () => {
    const fixture = buildHumanSupremacyEnforcementFixture({
      metadata: Object.freeze({ containmentDegradation: true }),
    });

    expect(fixture.result.record.failClosed).toBe(true);
    expect(["FROZEN", "REVOKED", "INVALID"]).toContain(fixture.result.record.enforcementState);
  });
});
