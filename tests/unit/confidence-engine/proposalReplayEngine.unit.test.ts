import { describe, expect, it } from "vitest";
import { scoreDeterministicConfidence } from "@/services/confidence-engine/deterministicConfidenceEngine";
import { buildDeterministicConfidenceFixture } from "@/tests/integration/confidence-engine/helpers";

describe("deterministicConfidenceEngine", () => {
  it("produces deterministic replay-safe confidence scores", () => {
    const fixture = buildDeterministicConfidenceFixture();

    expect(fixture.result.status).toBe("COMPLETED");
    expect(fixture.result.score.authorityGranted).toBe(false);
    expect(fixture.result.score.executionPermitted).toBe(false);
    expect(fixture.result.certification.certified).toBe(true);
  });

  it("fails closed on unknown model versions", () => {
    const fixture = buildDeterministicConfidenceFixture({
      scoringModelVersion: "deterministic-confidence-model-v999",
    });

    expect(fixture.result.errors.some((error) => error.code === "DETERMINISTIC_CONFIDENCE_SCORING_VERSION_UNKNOWN")).toBe(true);
  });

  it("freezes under upstream containment", () => {
    const base = buildDeterministicConfidenceFixture();
    const result = scoreDeterministicConfidence({
      ...base.input,
      proposalFreezeResult: {
        ...base.input.proposalFreezeResult,
        status: "FROZEN",
      },
    });

    expect(result.status).toBe("FROZEN");
    expect(result.score.cautionLevel).toBeDefined();
  });
});
