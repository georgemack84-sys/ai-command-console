import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessScoringFixture } from "@/tests/integration/constitutional-readiness-scoring/helpers";

describe("constitutional readiness scoring determinism", () => {
  it("produces identical scores and penalties for identical inputs", () => {
    const first = buildConstitutionalReadinessScoringFixture();
    const second = buildConstitutionalReadinessScoringFixture();

    expect(first.result.report.readinessScore).toBe(second.result.report.readinessScore);
    expect(first.result.confidence.confidenceScore).toBe(second.result.confidence.confidenceScore);
    expect(first.result.uncertaintyPenalty.penalty).toBe(second.result.uncertaintyPenalty.penalty);
  });
});
