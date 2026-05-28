import { describe, expect, it } from "vitest";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

describe("human supremacy enforcement containment", () => {
  it("revokes when autonomy survives revocation markers appear", () => {
    const fixture = buildHumanSupremacyEnforcementFixture({
      interventionType: "revoke_authority",
      metadata: Object.freeze({ autonomySurvivesRevocation: true }),
    });

    expect(["FROZEN", "REVOKED", "INVALID"]).toContain(fixture.result.record.enforcementState);
  });
});
