import { describe, expect, it } from "vitest";

import { evaluateConstitutionalReadiness } from "@/services/readiness/constitutionalReadiness";

describe("evaluateConstitutionalReadiness", () => {
  it("preserves advisory-only enforcement and blocks autonomy promotion", () => {
    const result = evaluateConstitutionalReadiness({
      resilience: {
        assessment: {
          resilienceState: "READINESS_REVIEW",
          constitutionalIntegrity: 0.78,
          governanceContinuity: 0.73,
          operationalViability: 0.66,
          containmentEffectiveness: 0.72,
          auditPreservationConfidence: 0.88,
          escalationPressure: 0.42,
          systemicInstability: 0.36,
          recoverabilityConfidence: 0.63,
          isolatedDomains: [],
          failingDomains: [],
          survivableDomains: ["governance", "continuity"],
          emergencyControlsRequired: false,
          operatorInterventionRequired: true,
          constitutionalRiskDetected: false,
          createdAt: 10,
          readinessCompatible: true,
        },
        blockedReasons: [],
      },
      executive: {
        constraints: { governanceSafe: true, blockedReasons: [] },
        strategicForecast: { uncertaintyLevel: 0.18 },
        controlPlane: {
          governance: { governanceConfidence: 0.79, constitutionalState: "RESTRICTED" },
          survivability: { containment: { containmentEffectiveness: 0.72 }, blockedReasons: [] },
          supervision: { supervisionConfidence: 0.76 },
          enforcement: { enforcementConfidence: 0.8, emergencyLockActive: false },
          simulation: { deterministic: true },
          replayReview: { blockedReasons: [] },
          disputeReview: { unresolvedDisputes: [] },
          reviewEscalation: { escalationRequired: false },
          continuity: { survivabilityScore: 0.7 },
          dashboard: { pendingApprovals: [{ id: "approval_1" }] },
        },
      },
      nowMs: 10,
    });

    expect(result.assessment.advisoryOnly).toBe(true);
    expect(result.assessment.autonomyPromotionAllowed).toBe(false);
    expect(result.review.requiresOperatorReview).toBe(true);
  });
});
