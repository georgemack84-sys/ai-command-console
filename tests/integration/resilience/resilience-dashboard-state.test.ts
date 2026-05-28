import { describe, expect, it } from "vitest";

import { assessConstitutionalResilience } from "@/services/resilience/resilienceAssessment";

describe("resilience dashboard state", () => {
  it("keeps disputed operations visible in the resilience state", () => {
    const result = assessConstitutionalResilience({
      continuityConfidence: 0.4,
      governanceDisputes: [{ executionId: "exec_1" }],
      operationalStabilityAssessment: { survivabilityScore: 0.5, escalationPressure: 0.4 } as never,
      stewardship: { governanceBlocked: false } as never,
      continuityConvergence: { divergenceScore: 0.4 } as never,
      generatedAt: "2026-05-09T00:00:00.000Z",
    } as never);

    expect(result.assessment.disputedConditions).toContain("governance_disputes_present");
  });
});
