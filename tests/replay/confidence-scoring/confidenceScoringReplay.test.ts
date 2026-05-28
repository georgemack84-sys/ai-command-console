import { describe, expect, it } from "vitest";
import { buildConfidenceScoringFixture } from "@/tests/integration/confidence-scoring/helpers";

describe("confidence scoring replay safety", () => {
  it("binds scoring to the original replay snapshot and weights", () => {
    const fixture = buildConfidenceScoringFixture();
    expect(fixture.result.replayRecords[0]?.replaySnapshotId).toBe(
      fixture.input.recommendationSynthesisInput.deterministicReplayResult.snapshot.snapshotId,
    );
    expect(fixture.result.weightRecord.weightId).toBe("confidence-weights-v1");
  });
});
