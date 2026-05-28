import { describe, expect, it } from "vitest";

import { evaluateEscalationThresholds } from "@/services/escalation/escalationThresholds";

describe("evaluateEscalationThresholds", () => {
  it("consumes stability metrics and recommends escalation under high degradation", () => {
    const result = evaluateEscalationThresholds({
      operationalState: "UNSTABLE",
      survivabilityScore: 0.3,
      degradationRate: 0.72,
      recoveryPressure: 0.65,
      escalationPressure: 0.61,
      continuityConfidence: 0.31,
      unstableSubsystems: ["workers", "replay"],
      stabilizationRequired: true,
      containmentRecommended: true,
      lockdownRecommended: false,
      replayInstabilityScore: 0.7,
      staleExecutionSpread: 0.4,
      dependencyInstabilityScore: 0.32,
      operatorInterventionPressure: 0.4,
      recoverySuccessConfidence: 0.22,
      trend: "DECLINING",
      confidence: 0.3,
      reasons: [],
      disputed: false,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.pressureScore).toBeGreaterThan(0.5);
    expect(["recovery", "containment", "governance", "emergency"]).toContain(result.recommendedType);
  });
});
