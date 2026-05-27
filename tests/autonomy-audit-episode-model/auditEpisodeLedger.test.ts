import { describe, expect, it } from "vitest";

import { appendAuditEpisodeLedger } from "@/services/autonomy-audit-episode-model";
import { buildAutonomyAuditEpisodeFixture } from "./helpers";

describe("auditEpisodeLedger", () => {
  it("appends immutable episode lineage", () => {
    const { episode } = buildAutonomyAuditEpisodeFixture();
    const appended = appendAuditEpisodeLedger({
      existing: episode.lineage,
      episodeId: episode.episodeId,
      episodeHash: episode.episodeHash,
      replayHash: episode.replayBinding.reconstructionHash,
      lineageHash: episode.replayBinding.triggerLineageHash,
      createdAt: "2026-05-16T16:21:00.000Z",
    });
    expect(appended.entries.length).toBe(episode.lineage.entries.length + 1);
    expect(appended.immutable).toBe(true);
  });
});
