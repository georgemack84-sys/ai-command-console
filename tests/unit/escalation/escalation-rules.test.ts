import { describe, expect, it } from "vitest";

import { evaluateEscalationRules } from "@/services/escalation/escalationRules";
import type { EscalationCoordinationInput } from "@/services/escalation/contracts/escalationTypes";

const baseInput: EscalationCoordinationInput = {
  executionId: "execution_1",
  source: "stability.engine",
  requestedType: "operator",
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
    trend: "STABLE",
    confidence: 0.82,
    reasons: [],
    disputed: false,
    timestamp: "2026-05-09T00:00:00.000Z",
  },
  timestamp: "2026-05-09T00:00:00.000Z",
};

describe("evaluateEscalationRules", () => {
  it("blocks escalation with no evidence", () => {
    expect(evaluateEscalationRules({ ...baseInput, evidence: [] }).blocked).toBe(true);
  });

  it("fails closed on low-confidence disputed state", () => {
    const result = evaluateEscalationRules({
      ...baseInput,
      stabilityAssessment: {
        ...baseInput.stabilityAssessment,
        disputed: true,
        confidence: 0.2,
      },
    });
    expect(result.blocked).toBe(true);
    expect(result.disputed).toBe(true);
  });

  it("requires stronger evidence for emergency escalation", () => {
    expect(evaluateEscalationRules({
      ...baseInput,
      requestedType: "emergency",
    }).blocked).toBe(true);
  });
});
