import { describe, expect, it } from "vitest";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

describe("human supremacy enforcement unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildHumanSupremacyEnforcementFixture();
    const second = buildHumanSupremacyEnforcementFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.forensicExport.exportHash).toBe(second.result.forensicExport.exportHash);
  });

  it("kill switch globally freezes and revokes", () => {
    const fixture = buildHumanSupremacyEnforcementFixture({
      interventionType: "kill_switch",
    });

    expect(fixture.result.record.enforcementState).toBe("SHUTDOWN");
    expect(fixture.result.killSwitch.active).toBe(true);
    expect(fixture.result.authorityRevocation.authorityRevoked).toBe(true);
  });
});
