import { describe, expect, it } from "vitest";

import { evaluateContinuityConvergence } from "@/services/convergence/continuityConvergenceEngine";

describe("evaluateContinuityConvergence", () => {
  it("returns converged state when signals align", () => {
    const { result } = evaluateContinuityConvergence({
      executionId: "execution_1",
      timestamp: "2026-05-09T00:00:00.000Z",
      continuity: {
        runtimeState: "HEALTHY",
        continuityConfidence: 0.92,
        degradedDependencies: [],
        staleExecutions: 0,
        replayDivergenceDetected: false,
      },
      verification: {
        status: "VERIFIED",
        disputed: false,
        divergenceDetected: false,
        evidence: ["event_1"],
      },
      stewardship: {
        state: "VERIFIED",
        shouldFreeze: false,
        shouldContain: false,
        shouldEscalate: false,
        governanceBlocked: false,
        verificationBlocked: false,
        stabilizationStatus: "stable",
        survivabilityScore: 0.91,
        evidence: ["event_1"],
      },
      stability: {
        operationalState: "STABLE",
        survivabilityScore: 0.9,
        degradationRate: 0.08,
        recoveryPressure: 0.1,
        escalationPressure: 0.08,
        continuityConfidence: 0.92,
        unstableSubsystems: [],
        stabilizationRequired: false,
        containmentRecommended: false,
        lockdownRecommended: false,
        replayInstabilityScore: 0.05,
        staleExecutionSpread: 0.02,
        dependencyInstabilityScore: 0.05,
        operatorInterventionPressure: 0.05,
        recoverySuccessConfidence: 0.9,
        trend: "STABLE",
        confidence: 0.88,
        reasons: [],
        disputed: false,
      },
      escalation: {
        escalationState: "ESCALATED",
        frozen: false,
        blocked: false,
        conflictingEscalations: [],
      } as never,
      auditHistory: [{ id: "audit_1" }],
    });

    expect(result.converged).toBe(true);
    expect(result.state).toBe("CONVERGED");
  });

  it("fails closed on ambiguous continuity state", () => {
    const { result } = evaluateContinuityConvergence({
      timestamp: "2026-05-09T00:00:00.000Z",
      stability: {
        disputed: true,
        survivabilityScore: 0.4,
        degradationRate: 0.5,
        continuityConfidence: 0.2,
      } as never,
      stewardship: {
        state: "DISPUTED",
        shouldFreeze: true,
        evidence: [],
      } as never,
    });

    expect(["DISPUTED", "FROZEN", "SYSTEMIC_RISK"]).toContain(result.state);
  });
});
