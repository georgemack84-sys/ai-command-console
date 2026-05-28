import { describe, expect, it } from "vitest";

import { deriveEscalationLineage } from "@/services/escalation/escalationLineage";

describe("deriveEscalationLineage", () => {
  it("is stable for equivalent inputs", () => {
    const input = {
      executionId: "execution_1",
      source: "stability.engine",
      requestedType: "operator" as const,
      reason: "degradation rising",
      evidence: ["event_1"],
      stabilityAssessment: {
        operationalState: "WATCH",
        survivabilityScore: 0.74,
        degradationRate: 0.21,
        recoveryPressure: 0.2,
        escalationPressure: 0.18,
        continuityConfidence: 0.8,
        unstableSubsystems: [],
        stabilizationRequired: false,
        containmentRecommended: false,
        lockdownRecommended: false,
        replayInstabilityScore: 0.08,
        staleExecutionSpread: 0.04,
        dependencyInstabilityScore: 0.1,
        operatorInterventionPressure: 0.1,
        recoverySuccessConfidence: 0.8,
        trend: "STABLE" as const,
        confidence: 0.82,
        reasons: [],
        disputed: false,
        timestamp: "2026-05-09T00:00:00.000Z",
      },
      timestamp: "2026-05-09T00:00:00.000Z",
    };

    expect(deriveEscalationLineage({ input })).toEqual(deriveEscalationLineage({ input }));
  });
});
