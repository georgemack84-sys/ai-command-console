import { describe, expect, it } from "vitest";
import { buildRecommendationSynthesisFixture } from "@/tests/integration/recommendation-synthesis/helpers";

describe("recommendation synthesis replay binding", () => {
  it("uses only the original replay snapshot and hash", () => {
    const fixture = buildRecommendationSynthesisFixture();
    const envelope = fixture.result.recommendations[0];

    expect(envelope?.replayMetadata.replaySnapshotId).toBe(fixture.input.deterministicReplayResult.snapshot.snapshotId);
    expect(envelope?.replayMetadata.replayHash).toBe(fixture.input.deterministicReplayResult.result.replayHash);
  });
});
