import { describe, expect, it } from "vitest";
import { certifyConfidenceDeterminism } from "@/services/confidence-engine/confidenceDeterminismCertifier";
import { buildDeterministicConfidenceFixture } from "@/tests/integration/confidence-engine/helpers";

describe("confidenceDeterminismCertifier", () => {
  it("certifies stable confidence reconstruction", () => {
    const fixture = buildDeterministicConfidenceFixture();
    const certification = certifyConfidenceDeterminism({
      score: fixture.result.score,
      lineage: fixture.result.lineage,
      governanceAdjustedScore: fixture.result.score.score,
    });

    expect(certification.certified).toBe(true);
    expect(certification.outputHashStable).toBe(true);
  });
});
