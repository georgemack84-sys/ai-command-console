import { describe, expect, it } from "vitest";

import { evaluateStrategicContinuity } from "@/services/continuity/strategicContinuityEngine";

describe("strategic continuity emergency", () => {
  it("fails closed during emergency governance and unsafe survivability collapse", () => {
    const result = evaluateStrategicContinuity({
      governance: {
        constitutionalState: "EMERGENCY_GOVERNANCE",
        governanceConfidence: 0.18,
        escalationRequired: true,
        containmentRequired: true,
        violations: ["governance_outage_detected"],
      },
      orchestration: {
        orchestrationAuthorized: false,
      },
      validation: {
        valid: false,
        freezeActivated: true,
        containmentActivated: true,
        blockedReasons: ["governance_outage_detected", "validation_freeze_required"],
      },
      readiness: {
        readinessState: "NOT_READY",
        readinessScore: 9,
      },
      simulationForecast: {
        advisoryOnly: true,
        collapseRisk: 0.91,
        containmentPressure: 0.82,
        governanceInstabilityRisk: 0.88,
      },
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.survivable).toBe(false);
    expect(result.collapseRisk).toBeGreaterThan(0.85);
    expect(result.recommendedActions).toContain("escalate_governance_review");
  });
});
