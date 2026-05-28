import { describe, expect, it } from "vitest";

import { assessConstitutionalSurvivability } from "@/services/survivability/survivabilityAssessment";

describe("runtime collapse", () => {
  it("fails closed when survivability confidence collapses", () => {
    const result = assessConstitutionalSurvivability({
      constitutionalIntegrity: 0.25,
      governanceContinuity: 0.31,
      operationalViability: 0.22,
      containmentEffectiveness: 0.29,
      auditPreservationConfidence: 0.41,
      escalationPressure: 0.91,
      systemicInstability: 0.88,
      recoverabilityConfidence: 0.21,
      unstableDomains: ["runtime"],
      failingDomains: ["runtime", "governance"],
      survivableDomains: [],
      disputed: false,
      freezeActive: false,
      emergencyControlsRequired: true,
      operatorInterventionRequired: true,
      constitutionalRiskDetected: true,
      nowMs: 2,
    });

    expect(result.survivabilityState).toBe("EMERGENCY_STABILIZATION");
  });
});
