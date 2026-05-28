import { describe, expect, it } from "vitest";
import { buildRecommendationConstraintFixture } from "./helpers";

describe("recommendation constraint integration", () => {
  it("preserves governance and replay bindings from the synthesis layer", () => {
    const fixture = buildRecommendationConstraintFixture();
    const governanceRecord = fixture.result.governanceRecords[0];
    const replayRecord = fixture.result.replayRecords[0];

    expect(governanceRecord?.governanceSnapshotId).toBe(
      fixture.input.recommendationSynthesisInput.recommendationValidationResult.result.governanceSnapshotId,
    );
    expect(replayRecord?.replaySnapshotId).toBe(
      fixture.input.recommendationSynthesisInput.deterministicReplayResult.snapshot.snapshotId,
    );
  });
});
