import { describe, expect, it } from "vitest";

import { evaluatePrioritizationGovernance } from "@/services/prioritization/prioritizationGovernance";

describe("evaluatePrioritizationGovernance", () => {
  it("requires governance review for overrides", () => {
    const result = evaluatePrioritizationGovernance({
      assessments: [],
      input: {
        candidates: [],
        evidence: ["event_1"],
        timestamp: "2026-05-09T00:00:00.000Z",
        overrideRequested: true,
      },
    } as never);

    expect(result.governanceReviewRequired).toBe(true);
    expect(result.warnings).toContain("priority_override_requested");
  });
});
