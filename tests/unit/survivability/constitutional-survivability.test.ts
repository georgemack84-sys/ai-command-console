import { describe, expect, it } from "vitest";

import { runConstitutionalSurvivabilityFramework } from "@/services/survivability/constitutionalSurvivabilityFramework";

describe("constitutional survivability", () => {
  it("produces deterministic survivability assessments", () => {
    const input = {
      governance: { constitutionalState: "RESTRICTED", governanceConfidence: 0.58, escalationRequired: true, containmentRequired: false, violations: [] as string[] },
      sovereignty: { sovereigntyState: "UNSTABLE", governanceIntegrity: 0.62, survivabilityConfidence: 0.55, systemicRisk: 0.48, containmentEffectiveness: 0.7, escalationPressure: 0.61, emergencyControlsRequired: false, unstableDomains: ["replay"] },
      continuity: { survivable: true, survivabilityScore: 0.57, collapseRisk: 0.42, containmentConfidence: 0.74, continuityTrajectory: "WATCH" },
      enforcement: { executable: false, enforcementState: "EXECUTION_SUPPRESSED", blockedReasons: ["approval_required"], containmentApplied: false, escalationTriggered: true, emergencyLockActive: false, enforcementConfidence: 0.61 },
      coordination: { coordinationState: "RESTRICTED", coordinationRisk: 0.51, deniedActions: ["autonomous_execution"], requiredOversight: ["operator_review_required"] },
      supervision: { supervisionState: "SUPERVISING", supervisedExecutionAllowed: false, stabilizationRecommended: true, escalationRequired: true, containmentRequired: false, operationalRisk: 0.55, supervisionConfidence: 0.59 },
      replayReview: { reviewState: "VERIFIED", divergenceCount: 0, blockedReasons: [] as string[] },
      disputeReview: { reviewState: "VERIFIED", unresolvedDisputes: [] as string[] },
      auditHistoryLength: 4,
      degradedSystems: ["replay"],
      nowMs: 1,
    };

    const left = runConstitutionalSurvivabilityFramework(input);
    const right = runConstitutionalSurvivabilityFramework(input);

    expect(left.assessment).toEqual(right.assessment);
    expect(left.assessment.survivabilityState).toBe("UNSTABLE");
  });
});
