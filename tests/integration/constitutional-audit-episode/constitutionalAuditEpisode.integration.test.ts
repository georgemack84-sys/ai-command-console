import { describe, expect, it } from "vitest";
import { buildConstitutionalAuditEpisodeFixture } from "./helpers";

describe("constitutional audit episode integration", () => {
  it("produces append-only lineage and replay ledger entries", () => {
    const first = buildConstitutionalAuditEpisodeFixture();
    const second = buildConstitutionalAuditEpisodeFixture({
      createdAt: "2026-05-18T15:05:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(first.result.lineage.entries).toHaveLength(1);
    expect(second.result.lineage.entries).toHaveLength(2);
    expect(first.result.replayLedger).toHaveLength(2);
    expect(second.result.replayLedger).toHaveLength(4);
    expect(second.result.replayLedger[1]?.entryHash).toBe(second.result.replayLedger[2]?.previousHash);
  });

  it("reconstructs a deterministic constitutional episode", () => {
    const fixture = buildConstitutionalAuditEpisodeFixture();

    expect(fixture.result.episode.observationLineage).toHaveLength(1);
    expect(fixture.result.episode.interpretationLineage).toHaveLength(1);
    expect(fixture.result.episode.recommendationLineage).toHaveLength(1);
    expect(fixture.result.episode.replayVerification.replayVerified).toBe(true);
  });
});
