import { describe, expect, it } from "vitest";
import { buildDecisionAuditEpisodeFixture } from "@/tests/integration/decision-audit-episode/helpers";

describe("decision audit replay", () => {
  it("preserves replay hash and replay certification", () => {
    const fixture = buildDecisionAuditEpisodeFixture();
    expect(fixture.result.episode.replayHash).toBe(fixture.input.deterministicReplayResult.result.replayHash);
    expect(fixture.result.episode.replayCertified).toBe(true);
  });
});
