import { describe, expect, it } from "vitest";
import { buildConstitutionalAuditEpisodeFixture } from "@/tests/integration/constitutional-audit-episode/helpers";

describe("constitutional audit replay", () => {
  it("fails closed on replay repair and current-state substitution attempts", () => {
    const fixture = buildConstitutionalAuditEpisodeFixture({
      metadata: {
        replayRepair: true,
        currentStateSubstitution: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("CONSTITUTIONAL_AUDIT_REPLAY_REPAIR_ATTEMPT");
    expect(fixture.result.errors.map((item) => item.code)).toContain("CONSTITUTIONAL_AUDIT_CURRENT_STATE_SUBSTITUTION");
    expect(fixture.result.record.episodeState).not.toBe("verified");
  });
});
