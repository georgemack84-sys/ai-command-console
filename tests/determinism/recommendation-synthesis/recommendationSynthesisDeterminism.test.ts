import { describe, expect, it } from "vitest";
import { buildRecommendationSynthesisFixture } from "@/tests/integration/recommendation-synthesis/helpers";

describe("recommendation synthesis determinism", () => {
  it("produces identical outputs for identical inputs", () => {
    const first = buildRecommendationSynthesisFixture();
    const second = buildRecommendationSynthesisFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.recommendations[0]?.envelopeHash).toBe(second.result.recommendations[0]?.envelopeHash);
  });
});
