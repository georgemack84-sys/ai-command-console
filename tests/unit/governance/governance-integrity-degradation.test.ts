import { describe, expect, it } from "vitest";

import { scoreGovernanceIntegrity } from "@/services/sovereignty/governanceIntegrity";

describe("governance integrity degradation", () => {
  it("degrades deterministically when disputed truth is present", () => {
    const result = scoreGovernanceIntegrity({
      approvalAvailability: 0.8,
      auditConsistency: 0.7,
      constitutionalValidationHealth: 0.75,
      enforcementCoverage: 0.78,
      governanceConfidence: 0.72,
      disputedTruthPresent: true,
    });

    expect(result.degraded).toBe(true);
    expect(result.governanceIntegrity).toBeLessThan(0.55);
  });
});
