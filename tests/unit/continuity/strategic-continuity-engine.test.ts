import { describe, expect, it } from "vitest";

import { evaluateStrategicContinuity } from "@/services/continuity/strategicContinuityEngine";

describe("evaluateStrategicContinuity", () => {
  it("remains advisory-only and fail-closed under disputed truth", () => {
    const result = evaluateStrategicContinuity({
      governance: {
        constitutionalState: "DENIED",
        governanceConfidence: 0.24,
        escalationRequired: true,
        containmentRequired: true,
        violations: ["disputed_truth_detected"],
      },
      orchestration: {
        orchestrationAuthorized: false,
      },
      validation: {
        valid: false,
        freezeActivated: true,
        containmentActivated: true,
        blockedReasons: ["validation_freeze_required"],
      },
      readiness: {
        readinessState: "CONSTITUTIONALLY_BLOCKED",
        readinessScore: 18,
      },
      simulationForecast: {
        advisoryOnly: true,
        collapseRisk: 0.84,
        containmentPressure: 0.76,
        governanceInstabilityRisk: 0.72,
      },
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.survivable).toBe(false);
    expect(result.recommendedActions).toContain("maintain_constitutional_freeze");
    expect(result.recommendedActions).toContain("operator_review_required");
  });
});
