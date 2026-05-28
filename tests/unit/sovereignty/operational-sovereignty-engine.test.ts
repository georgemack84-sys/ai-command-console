import { describe, expect, it } from "vitest";

import { evaluateOperationalSovereignty } from "@/services/sovereignty/operationalSovereigntyEngine";

describe("evaluateOperationalSovereignty", () => {
  it("produces advisory-only sovereignty assessment signals", () => {
    const result = evaluateOperationalSovereignty({
      governanceConfidence: 0.44,
      survivabilityConfidence: 0.41,
      escalationPressure: 0.77,
      activeContainment: true,
      failedContainmentAttempts: 0.55,
      unresolvedInstability: 0.68,
      repeatedRecoveryLoops: 0.64,
      containmentWeakness: 0.58,
      runawayAutonomySignals: 0.72,
      governanceFailures: 0.61,
      crossDomainInstability: 0.67,
      constitutionalDegradation: 0.63,
      approvalAvailability: 0.48,
      auditConsistency: 0.51,
      constitutionalValidationHealth: 0.54,
      enforcementCoverage: 0.52,
      disputedTruthPresent: false,
    });

    expect(["UNSTABLE", "GOVERNANCE_RISK", "CRITICAL", "SURVIVABILITY_RISK", "CONTAINMENT_ACTIVE", "COLLAPSING", "EMERGENCY_CONTAINMENT"]).toContain(result.sovereigntyState);
    expect(result.systemicRisk).toBeGreaterThan(0.5);
  });
});
