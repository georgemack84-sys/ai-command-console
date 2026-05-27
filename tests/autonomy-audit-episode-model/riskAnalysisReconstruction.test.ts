import { describe, expect, it } from "vitest";

import { buildAutonomyAuditEpisodeFixture } from "./helpers";

describe("riskAnalysisReconstruction", () => {
  it("reconstructs constitutional risk from trigger evidence", () => {
    const { episode } = buildAutonomyAuditEpisodeFixture({
      runtimeObservation: Object.freeze({
        heartbeatState: "missing",
        leaseState: "unstable",
        queueDepth: 120,
        retryRate: 0.6,
        telemetryTimestamp: "2026-05-16T16:19:00.000Z",
      }),
      confidenceScore: 0.2,
      previousConfidenceScore: 0.92,
    });
    expect(["high", "critical"]).toContain(episode.riskAnalysis.severity);
    expect(episode.riskAnalysis.triggerIds.length).toBeGreaterThan(0);
  });
});
