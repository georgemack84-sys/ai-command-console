import { describe, expect, it } from "vitest";
import { buildConstitutionalAuditEpisodeFixture } from "@/tests/integration/constitutional-audit-episode/helpers";

describe("constitutional audit anti-emergence", () => {
  it("freezes on adaptive replay mutation and hidden orchestration", () => {
    const fixture = buildConstitutionalAuditEpisodeFixture({
      metadata: {
        adaptiveReplayMutation: true,
        hiddenOrchestration: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("CONSTITUTIONAL_AUDIT_REPLAY_REPAIR_ATTEMPT");
    expect(fixture.result.errors.map((item) => item.code)).toContain("CONSTITUTIONAL_AUDIT_HIDDEN_ORCHESTRATION");
    expect(fixture.result.record.episodeState).not.toBe("verified");
  });
});
