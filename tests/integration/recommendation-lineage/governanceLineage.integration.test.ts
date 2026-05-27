import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "./helpers";

describe("governance lineage integration", () => {
  it("binds recommendation ancestry to immutable governance state", () => {
    const fixture = buildRecommendationLineageFixture();
    expect(fixture.result.artifact.governanceSnapshotId).toBe(fixture.input.constitutionalReadinessResult.record.governanceSnapshotId);
  });
});
