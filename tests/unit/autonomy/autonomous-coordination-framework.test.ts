import { describe, expect, it } from "vitest";

import { runAutonomousCoordinationFramework } from "@/services/autonomy/autonomousCoordinationFramework";

describe("runAutonomousCoordinationFramework", () => {
  it("remains bounded and supervisory-only under containment precedence", () => {
    const result = runAutonomousCoordinationFramework({
      strategicContinuity: {
        survivable: false,
        survivabilityScore: 0.34,
        continuityTrajectory: "UNSTABLE",
        escalationPressure: 0.72,
        governancePressure: 0.68,
        stabilizationConfidence: 0.41,
        collapseRisk: 0.81,
        containmentConfidence: 0.33,
        recommendedActions: ["maintain_constitutional_freeze"],
        timestamp: "2026-05-09T00:00:00.000Z",
      },
      governance: {
        allowed: false,
        constitutionalState: "CONTAINED",
        violations: ["containment_verification_failed"],
        escalationRequired: true,
        containmentRequired: true,
      },
      orchestration: {
        orchestrationAuthorized: false,
        locked: true,
      },
      validation: {
        valid: false,
        freezeActivated: true,
        blockedReasons: ["validation_freeze_required"],
      },
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.constitutionalSafe).toBe(false);
    expect(result.deniedActions).toContain("autonomous_execution");
    expect(result.requiredOversight).toContain("operator_review_required");
    expect(result.coordinationState).toBe("CONTAINED");
  });
});
