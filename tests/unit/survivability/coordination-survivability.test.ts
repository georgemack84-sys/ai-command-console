import { describe, expect, it } from "vitest";

import { runConstitutionalSurvivabilityFramework } from "@/services/survivability/constitutionalSurvivabilityFramework";

describe("coordination survivability", () => {
  it("escalates coordination freeze into survivability handling", () => {
    const result = runConstitutionalSurvivabilityFramework({
      governance: { constitutionalState: "RESTRICTED", governanceConfidence: 0.44, escalationRequired: true, containmentRequired: true, violations: [] },
      sovereignty: { sovereigntyState: "UNSTABLE", governanceIntegrity: 0.45, survivabilityConfidence: 0.39, systemicRisk: 0.66, containmentEffectiveness: 0.48, escalationPressure: 0.73, emergencyControlsRequired: false, unstableDomains: ["coordination"] },
      continuity: { survivable: false, survivabilityScore: 0.39, collapseRisk: 0.63, containmentConfidence: 0.44, continuityTrajectory: "DECLINING" },
      enforcement: { executable: false, enforcementState: "CONTAINMENT_ACTIVE", blockedReasons: ["coordination_freeze_active"], containmentApplied: true, escalationTriggered: true, emergencyLockActive: false, enforcementConfidence: 0.41 },
      coordination: { coordinationState: "CONTAINED", coordinationRisk: 0.77, deniedActions: ["unbounded_coordination"], requiredOversight: ["operator_review_required"] },
      supervision: { supervisionState: "FROZEN", supervisedExecutionAllowed: false, stabilizationRecommended: true, escalationRequired: true, containmentRequired: true, operationalRisk: 0.79, supervisionConfidence: 0.36 },
      replayReview: { reviewState: "VERIFIED", divergenceCount: 0, blockedReasons: [] },
      disputeReview: { reviewState: "VERIFIED", unresolvedDisputes: [] },
      auditHistoryLength: 3,
      degradedSystems: ["coordination"],
      nowMs: 3,
    });

    expect(["CONTAIN", "ISOLATE"]).toContain(result.containment.recommendedAction);
    expect(result.assessment.survivabilityState).toMatch(/CONTAINED|CRITICAL|SURVIVABILITY_MODE/);
  });
});
