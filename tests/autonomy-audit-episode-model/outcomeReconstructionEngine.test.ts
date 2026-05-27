import { describe, expect, it } from "vitest";

import { buildAutonomyAuditEpisodeFixture } from "./helpers";

describe("outcomeReconstructionEngine", () => {
  it("reconstructs only constitutional, non-execution outcomes", () => {
    const { episode } = buildAutonomyAuditEpisodeFixture({
      confidenceScore: 0.15,
      previousConfidenceScore: 0.91,
    });
    expect(["approved", "denied", "frozen", "revoked", "superseded", "expired", "escalated", "archived"]).toContain(episode.outcome.state);
  });
});
