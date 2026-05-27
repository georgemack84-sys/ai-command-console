import { describe, expect, it } from "vitest";

import { buildAutonomyAuditEpisode } from "@/services/autonomy-audit-episode-model";
import { buildAutonomyAuditEpisodeFixture } from "./helpers";

describe("autonomyAuditEpisodeEngine", () => {
  it("builds immutable replay-safe audit episodes", () => {
    const { input } = buildAutonomyAuditEpisodeFixture();
    const first = buildAutonomyAuditEpisode(input);
    const second = buildAutonomyAuditEpisode(input);
    expect(first.episodeHash).toBe(second.episodeHash);
    expect(first.immutable).toBe(true);
    expect(first.recommendations.length).toBeGreaterThan(0);
  });
});
