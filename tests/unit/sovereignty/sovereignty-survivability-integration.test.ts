import { describe, expect, it } from "vitest";

import { evaluateOperationalSovereignty } from "@/services/sovereignty/operationalSovereigntyEngine";

describe("sovereignty survivability integration", () => {
  it("treats survivability degradation as sovereignty pressure", () => {
    const result = evaluateOperationalSovereignty({
      governanceConfidence: 0.61,
      survivabilityConfidence: 0.24,
      escalationPressure: 0.64,
      activeContainment: false,
      failedContainmentAttempts: 0.12,
      unresolvedInstability: 0.42,
      repeatedRecoveryLoops: 0.35,
      containmentWeakness: 0.3,
      runawayAutonomySignals: 0.2,
      governanceFailures: 0.32,
      crossDomainInstability: 0.45,
      constitutionalDegradation: 0.38,
      approvalAvailability: 0.78,
      auditConsistency: 0.82,
      constitutionalValidationHealth: 0.8,
      enforcementCoverage: 0.8,
      disputedTruthPresent: false,
    });

    expect(["SURVIVABILITY_RISK", "CRITICAL", "COLLAPSING"]).toContain(result.sovereigntyState);
  });
});
