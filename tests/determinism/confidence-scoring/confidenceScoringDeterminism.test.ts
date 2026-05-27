import { describe, expect, it } from "vitest";
import { buildConfidenceScoringFixture } from "@/tests/integration/confidence-scoring/helpers";

describe("confidence scoring determinism", () => {
  it("produces identical scores and hashes for identical inputs", () => {
    const first = buildConfidenceScoringFixture();
    const second = buildConfidenceScoringFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.confidenceScores[0]?.overallConfidence).toBe(second.result.confidenceScores[0]?.overallConfidence);
  });
});
