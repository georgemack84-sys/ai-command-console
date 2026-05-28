import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "./helpers";

describe("recommendation replay integration", () => {
  it("reconstructs replay ancestry from immutable upstream state", () => {
    const fixture = buildRecommendationLineageFixture();
    expect(fixture.result.snapshot.replaySnapshotId).toBe(fixture.input.constitutionalReadinessResult.record.replaySnapshotId);
  });
});
