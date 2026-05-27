import { describe, expect, it } from "vitest";

import { evaluateEscalationPolicy } from "@/services/escalation/escalationPolicies";

describe("evaluateEscalationPolicy", () => {
  it("maps catastrophic emergency conditions to catastrophic severity", () => {
    const result = evaluateEscalationPolicy({
      requestedType: "emergency",
      stabilityAssessment: {
        operationalState: "COLLAPSING",
        survivabilityScore: 0.08,
        degradationRate: 0.9,
        recoveryPressure: 0.8,
        escalationPressure: 0.8,
        continuityConfidence: 0.12,
        unstableSubsystems: ["replay"],
        stabilizationRequired: true,
        containmentRecommended: true,
        lockdownRecommended: true,
        replayInstabilityScore: 0.9,
        staleExecutionSpread: 0.8,
        dependencyInstabilityScore: 0.8,
        operatorInterventionPressure: 0.7,
        recoverySuccessConfidence: 0.1,
        trend: "COLLAPSING",
        confidence: 0.18,
        reasons: [],
        disputed: false,
        timestamp: "2026-05-09T00:00:00.000Z",
      },
    });

    expect(result.escalationSeverity).toBe("CATASTROPHIC");
    expect(result.requiresContainment).toBe(true);
  });
});
