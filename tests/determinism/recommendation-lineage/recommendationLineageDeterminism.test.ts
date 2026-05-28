import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage determinism", () => {
  it("produces identical hashes for identical inputs", () => {
    const first = buildRecommendationLineageFixture();
    const second = buildRecommendationLineageFixture();
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
  });
});
