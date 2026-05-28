import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage determinism unit", () => {
  it("produces identical graph and replay hashes", () => {
    const first = buildRecommendationLineageFixture();
    const second = buildRecommendationLineageFixture();
    expect(first.result.graph.graphHash).toBe(second.result.graph.graphHash);
    expect(first.result.artifact.replayHash).toBe(second.result.artifact.replayHash);
  });
});
