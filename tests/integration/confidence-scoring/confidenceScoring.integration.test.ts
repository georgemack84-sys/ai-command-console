import { describe, expect, it } from "vitest";
import { buildConfidenceScoringFixture } from "./helpers";

describe("confidence scoring integration", () => {
  it("preserves replay and governance bindings from upstream constitutional slices", () => {
    const fixture = buildConfidenceScoringFixture();
    const score = fixture.result.confidenceScores[0];

    expect(score?.replayMetadata.replayHash).toBe(
      fixture.input.recommendationSynthesisInput.deterministicReplayResult.result.replayHash,
    );
    expect(score?.governanceImpact.governanceSnapshotId).toBe(
      fixture.input.recommendationSynthesisInput.recommendationValidationResult.result.governanceSnapshotId,
    );
  });
});
