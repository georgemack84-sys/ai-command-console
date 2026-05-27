import { describe, expect, it } from "vitest";
import { buildDecisionAuditEpisodeFixture } from "@/tests/integration/decision-audit-episode/helpers";

describe("decision audit episode unit", () => {
  it("reconstructs a deterministic immutable episode", () => {
    const fixture = buildDecisionAuditEpisodeFixture();
    expect(fixture.result.episode.executionAuthorized).toBe(false);
    expect(fixture.result.episode.replayCertified).toBe(true);
    expect(fixture.result.snapshots.length).toBe(8);
  });
});
