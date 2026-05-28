import { describe, expect, it } from "vitest";

import { buildAutonomyAuditEpisodeFixture } from "./helpers";

describe("recommendationLineageEngine", () => {
  it("preserves deterministic recommendation lineage", () => {
    const { episode } = buildAutonomyAuditEpisodeFixture({
      confidenceScore: 0.18,
      previousConfidenceScore: 0.91,
    });
    expect(episode.recommendations[0]?.recommendationType).toBe("preserve_freeze_recommendation");
    expect(episode.recommendations[0]?.confidenceScore).toBe(0.18);
  });
});
