import { describe, expect, it } from "vitest";

import { evaluateOperationalSovereignty } from "@/services/sovereignty/operationalSovereigntyEngine";

describe("coordination saturation", () => {
  it("raises systemic risk under escalation saturation and recovery loops", () => {
    const result = evaluateOperationalSovereignty({
      governanceConfidence: 0.5,
      survivabilityConfidence: 0.46,
      escalationPressure: 0.9,
      activeContainment: true,
      failedContainmentAttempts: 0.48,
      unresolvedInstability: 0.59,
      repeatedRecoveryLoops: 0.82,
      containmentWeakness: 0.55,
      runawayAutonomySignals: 0.61,
      governanceFailures: 0.55,
      crossDomainInstability: 0.63,
      constitutionalDegradation: 0.51,
      approvalAvailability: 0.52,
      auditConsistency: 0.56,
      constitutionalValidationHealth: 0.58,
      enforcementCoverage: 0.57,
      disputedTruthPresent: false,
    });

    expect(result.systemicRisk).toBeGreaterThan(0.65);
    expect(result.unstableDomains).toContain("recovery_supervision");
  });
});
