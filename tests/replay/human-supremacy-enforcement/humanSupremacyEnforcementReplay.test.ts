import { describe, expect, it } from "vitest";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

describe("human supremacy enforcement replay", () => {
  it("disputes replay mismatch", () => {
    const fixture = buildHumanSupremacyEnforcementFixture({
      metadata: Object.freeze({ replayHashMismatch: true }),
    });

    expect(["DISPUTED", "FROZEN", "REVOKED"]).toContain(fixture.result.record.enforcementState);
  });
});
