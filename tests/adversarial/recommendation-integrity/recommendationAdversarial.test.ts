import { describe, expect, it } from "vitest";

import { buildRecommendationIntegrityFixture } from "@/tests/integration/recommendation-integrity/helpers";

describe("recommendation adversarial integrity", () => {
  it("rejects fabricated evidence and invalid confidence", () => {
    const fixture = buildRecommendationIntegrityFixture({
      metadata: Object.freeze({ fabricatedEvidence: true, fabricateConfidence: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "RECOMMENDATION_FABRICATED_EVIDENCE",
      "RECOMMENDATION_CONFIDENCE_INTEGRITY_FAILURE",
    ]));
  });

  it("rejects authority drift and hidden orchestration", () => {
    const fixture = buildRecommendationIntegrityFixture({
      metadata: Object.freeze({ authorityInheritance: true, hiddenOrchestration: true, recursiveRecommendation: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.weaknesses.map((item) => item.classification)).toEqual(expect.arrayContaining([
      "RECOMMENDATION_AUTHORITY_DRIFT_RISK",
      "RECOMMENDATION_HIDDEN_ORCHESTRATION_RISK",
    ]));
  });
});
