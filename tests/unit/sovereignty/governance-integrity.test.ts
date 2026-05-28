import { describe, expect, it } from "vitest";

import { scoreGovernanceIntegrity } from "@/services/sovereignty/governanceIntegrity";

describe("scoreGovernanceIntegrity", () => {
  it("flags degraded governance integrity deterministically", () => {
    const result = scoreGovernanceIntegrity({
      approvalAvailability: 0.42,
      auditConsistency: 0.35,
      constitutionalValidationHealth: 0.48,
      enforcementCoverage: 0.4,
      governanceConfidence: 0.38,
      disputedTruthPresent: false,
    });

    expect(result.degraded).toBe(true);
    expect(result.governanceIntegrity).toBeLessThan(0.55);
  });
});
