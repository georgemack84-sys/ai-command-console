import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "./helpers";

describe("approval lineage integration", () => {
  it("preserves operator intervention ancestry", () => {
    const fixture = buildRecommendationLineageFixture();
    expect(fixture.result.artifact.interventionSnapshotId).toBe(fixture.input.humanSupremacyResult.record.supremacyId);
  });
});
