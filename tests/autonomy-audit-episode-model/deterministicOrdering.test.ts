import { describe, expect, it } from "vitest";

import { buildAutonomyAuditEpisode } from "@/services/autonomy-audit-episode-model";
import { buildAutonomyAuditEpisodeFixture } from "./helpers";

describe("autonomy audit deterministic ordering", () => {
  it("produces stable hashes for identical inputs", () => {
    const { input } = buildAutonomyAuditEpisodeFixture();
    const first = buildAutonomyAuditEpisode(input);
    const second = buildAutonomyAuditEpisode(input);
    expect(first.episodeHash).toBe(second.episodeHash);
  });
});
