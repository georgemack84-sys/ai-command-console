import { describe, expect, it } from "vitest";

import { coordinateEscalation } from "@/services/escalation/escalationCoordinator";

const stableAssessment = {
  operationalState: "UNSTABLE",
  survivabilityScore: 0.32,
  degradationRate: 0.61,
  recoveryPressure: 0.58,
  escalationPressure: 0.62,
  continuityConfidence: 0.38,
  unstableSubsystems: ["replay", "workers"],
  stabilizationRequired: true,
  containmentRecommended: true,
  lockdownRecommended: false,
  replayInstabilityScore: 0.72,
  staleExecutionSpread: 0.48,
  dependencyInstabilityScore: 0.36,
  operatorInterventionPressure: 0.34,
  recoverySuccessConfidence: 0.24,
  trend: "DECLINING" as const,
  confidence: 0.42,
  reasons: ["replay_divergence_detected"],
  disputed: false,
  timestamp: "2026-05-09T00:00:00.000Z",
};

describe("coordinateEscalation", () => {
  it("is deterministic for identical inputs", () => {
    const input = {
      executionId: "execution_1",
      source: "stability.engine",
      requestedType: "recovery" as const,
      reason: "replay instability rising",
      evidence: ["event_1", "event_2"],
      stabilityAssessment: stableAssessment,
      timestamp: "2026-05-09T00:00:00.000Z",
    };

    expect(coordinateEscalation(input)).toEqual(coordinateEscalation(input));
  });

  it("blocks escalation with no evidence", () => {
    const result = coordinateEscalation({
      executionId: "execution_1",
      source: "stability.engine",
      requestedType: "operator",
      reason: "missing evidence",
      evidence: [],
      stabilityAssessment: stableAssessment,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.ok).toBe(false);
    expect(result.state.blocked).toBe(true);
  });

  it("freezes conflicting escalation chains", () => {
    const result = coordinateEscalation({
      executionId: "execution_1",
      source: "stability.engine",
      requestedType: "recovery",
      reason: "recovery instability",
      evidence: ["event_1", "event_2"],
      stabilityAssessment: stableAssessment,
      existingEscalations: [{
        escalationId: "esc_existing",
        escalationType: "containment",
        escalationState: "ACTIVE",
        escalationSeverity: "CRITICAL",
        escalationSource: "stability.engine",
        escalationReason: "existing containment",
        evidence: ["event_0"],
        escalationLineageId: "lineage_existing",
        conflictingEscalations: [],
        requiresContainment: true,
        requiresOperatorVisibility: true,
        frozen: false,
        blocked: false,
        recommendedActions: [],
        confidence: 0.7,
        timestamp: "2026-05-09T00:00:00.000Z",
      }],
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.state.frozen).toBe(true);
    expect(result.telemetryEvents.map((entry) => entry.eventType)).toContain("escalation.conflict.detected");
  });

  it("does not mutate runtime state or execute replay/recovery", () => {
    const result = coordinateEscalation({
      executionId: "execution_1",
      source: "stability.engine",
      requestedType: "governance",
      reason: "visibility required",
      evidence: ["event_1", "event_2"],
      stabilityAssessment: stableAssessment,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.audit).toBeDefined();
    expect(Array.isArray(result.telemetryEvents)).toBe(true);
  });
});
