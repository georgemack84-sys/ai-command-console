import { describe, expect, it } from "vitest";

import { validateReplayIntegrity } from "@/services/validation/replayIntegrityValidation";

describe("validateReplayIntegrity", () => {
  it("freezes on replay corruption and preserves immutability", () => {
    const result = validateReplayIntegrity({
      replayVerificationState: "DIVERGED",
      replayDivergenceCount: 3,
      immutableEvidenceValid: false,
      simulationLineage: ["simulation:replay"],
      decisionForecastLineageIds: ["lineage_1"],
      replayCorrupted: true,
    });

    expect(result.valid).toBe(false);
    expect(result.freezeActivated).toBe(true);
    expect(result.containmentRequired).toBe(true);
    expect(result.blockedReasons).toContain("replay_corruption_detected");
    expect(result.blockedReasons).toContain("immutable_replay_evidence_invalid");
  });
});
