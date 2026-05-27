import { describe, expect, it } from "vitest";
import { buildHumanSupremacyEnforcementFixture } from "./helpers";

describe("human supremacy enforcement integration", () => {
  it("propagates operator override deterministically", () => {
    const fixture = buildHumanSupremacyEnforcementFixture();

    expect(fixture.result.record.enforcementState).toBe("ENFORCED");
    expect(fixture.result.overridePropagation.globallyPropagated).toBe(true);
    expect(fixture.result.errors).toHaveLength(0);
  });

  it("preserves append-only intervention lineage and ledger behavior", () => {
    const first = buildHumanSupremacyEnforcementFixture();
    const second = buildHumanSupremacyEnforcementFixture({
      supremacyId: "human-supremacy-2",
      createdAt: "2026-05-18T22:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger.length).toBeGreaterThan(first.result.replayLedger.length);
  });
});
