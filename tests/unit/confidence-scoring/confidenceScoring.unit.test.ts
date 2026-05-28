import { describe, expect, it } from "vitest";
import { buildConfidenceScoringFixture } from "@/tests/integration/confidence-scoring/helpers";

describe("confidence scoring engine", () => {
  it("produces deterministic non-executing confidence scores on the happy path", () => {
    const fixture = buildConfidenceScoringFixture();
    const score = fixture.result.confidenceScores[0];

    expect(fixture.result.freeze.frozen).toBe(false);
    expect(score?.executionAuthorized).toBe(false);
    expect(score?.operatorDecisionRequired).toBe(true);
    expect(score?.overallConfidence).toBeGreaterThan(0);
  });

  it("records immutable confidence audit history", () => {
    const fixture = buildConfidenceScoringFixture();
    expect(fixture.result.auditRecords.length).toBeGreaterThan(0);
    expect(fixture.result.auditLedger.length).toBe(fixture.result.auditRecords.length);
  });
});
