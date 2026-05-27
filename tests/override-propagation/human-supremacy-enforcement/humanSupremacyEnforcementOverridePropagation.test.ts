import { describe, expect, it } from "vitest";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

describe("human supremacy enforcement override propagation", () => {
  it("freezes on partial override propagation", () => {
    const fixture = buildHumanSupremacyEnforcementFixture({
      metadata: Object.freeze({ partialOverridePropagation: true }),
    });

    expect(fixture.result.record.enforcementState).toBe("FROZEN");
    expect(fixture.result.overridePropagation.globallyPropagated).toBe(false);
  });
});
