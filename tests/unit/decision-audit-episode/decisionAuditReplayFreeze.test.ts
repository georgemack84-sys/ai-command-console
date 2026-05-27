import { describe, expect, it } from "vitest";
import { buildDecisionAuditEpisodeFixture } from "@/tests/integration/decision-audit-episode/helpers";

describe("decision audit replay freeze", () => {
  it("freezes when replay certification is lost", () => {
    const fixture = buildDecisionAuditEpisodeFixture({
      deterministicReplayResult: Object.freeze({
        ...buildDecisionAuditEpisodeFixture().input.deterministicReplayResult,
        result: Object.freeze({
          ...buildDecisionAuditEpisodeFixture().input.deterministicReplayResult.result,
          replayCertified: false,
        }),
      }),
    });
    expect(fixture.result.errors.some((error) => error.code === "DECISION_AUDIT_EPISODE_REPLAY_MISMATCH")).toBe(true);
  });
});
