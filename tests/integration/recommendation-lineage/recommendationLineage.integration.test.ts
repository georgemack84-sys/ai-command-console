import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "./helpers";

describe("recommendation lineage integration", () => {
  it("builds append-only lineage and replay ledger", () => {
    const fixture = buildRecommendationLineageFixture();
    expect(fixture.result.lineage.entries.length).toBe(1);
    expect(fixture.result.replayLedger.length).toBe(2);
  });
});
