import { describe, expect, it } from "vitest";

import { validateSovereigntySurvivability } from "@/services/validation/survivabilityValidation";

describe("validateSovereigntySurvivability", () => {
  it("preserves survivability-safe validation only when inherited signals are healthy", () => {
    const result = validateSovereigntySurvivability({
      survivabilityConfidence: 0.72,
      governanceReliability: 0.76,
      containmentIntegrity: 0.71,
      operationalStability: 0.69,
      disputedSystems: [],
      immutableAuditVerified: true,
      createdAt: 10,
    });

    expect(result.survivabilitySafe).toBe(true);
    expect(result.immutableAuditVerified).toBe(true);
  });
});
