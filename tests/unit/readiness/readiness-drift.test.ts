import { describe, expect, it } from "vitest";

import { analyzeReadinessDrift } from "@/services/readiness/readinessDriftAnalysis";

describe("analyzeReadinessDrift", () => {
  it("detects degradation velocity for declining readiness domains", () => {
    const drifts = analyzeReadinessDrift({
      previous: {
        governanceReliability: 0.9,
        auditIntegrity: 0.91,
        containmentSurvivability: 0.82,
      },
      current: {
        governanceReliability: 0.72,
        auditIntegrity: 0.75,
        containmentSurvivability: 0.6,
      },
    });

    expect(drifts.map((drift) => drift.domain)).toContain("governanceReliability");
    expect(drifts[0]?.degradationVelocity).toBeGreaterThan(0);
  });
});
