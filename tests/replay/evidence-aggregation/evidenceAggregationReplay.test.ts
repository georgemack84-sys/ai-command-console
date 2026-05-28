import { describe, expect, it } from "vitest";
import { buildEvidenceAggregationFixture } from "@/tests/integration/evidence-aggregation/helpers";

describe("evidence aggregation replay safety", () => {
  it("binds to the original replay snapshot and hash", () => {
    const fixture = buildEvidenceAggregationFixture();

    expect(fixture.result.replayRecord.replaySnapshotId).toBe(
      fixture.input.recommendationSynthesisInput.deterministicReplayResult.snapshot.snapshotId,
    );
    expect(fixture.result.replayRecord.replayHash).toBe(
      fixture.input.recommendationSynthesisInput.deterministicReplayResult.result.replayHash,
    );
  });
});
