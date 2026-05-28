import { describe, expect, it } from "vitest";

import { buildConstitutionalSovereigntyEngine } from "@/services/sovereignty/constitutionalSovereigntyEngine";

describe("buildConstitutionalSovereigntyEngine", () => {
  it("preserves advisory-only, deterministic sovereignty assessment", () => {
    const result = buildConstitutionalSovereigntyEngine({
      executive: {
        governancePressure: { governanceIntegrity: 0.78, escalationPressure: 0.42, containmentPressure: 0.66, operationalRisk: 0.48, autonomyPressure: 0.31, constitutionalStability: 0.74, approvalBacklog: 0.2, survivabilityPressure: 0.54 },
        constraints: { governanceSafe: true, blockedReasons: [] },
        controlPlane: {
          sovereignty: { governanceIntegrity: 0.78, survivabilityConfidence: 0.69, systemicRisk: 0.36, containmentEffectiveness: 0.71, escalationPressure: 0.42, emergencyControlsRequired: false, unstableDomains: ["coordination"] },
          coordination: { deniedActions: ["autonomous_execution"], requiredOversight: ["operator_review_required"], coordinationRisk: 0.43 },
          governance: { constitutionalState: "RESTRICTED" },
        },
      },
      resilience: {
        assessment: { constitutionalIntegrity: 0.76, recoverabilityConfidence: 0.64, operationalViability: 0.67, systemicInstability: 0.41, emergencyControlsRequired: false, operatorInterventionRequired: true },
        blockedReasons: [],
      },
      readiness: {
        assessment: { governanceReliability: 0.79, readinessConfidence: 0.77, blockingRisks: [], advisoryOnly: true, constitutionalSafe: true, autonomyPromotionAllowed: false },
      },
      nowMs: 10,
    });

    expect(result.assessment.constitutionalSafe).toBe(true);
    expect(result.assessment.immutableAuditHealthy).toBe(true);
    expect(result.assessment.operatorInterventionRequired).toBe(true);
  });
});
