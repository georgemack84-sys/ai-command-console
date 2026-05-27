import { describe, expect, it } from "vitest";

import { evaluateRuntimeConstitutionalResilience } from "@/services/resilience/runtimeConstitutionalResilience";

describe("governance freeze", () => {
  it("enters constitutional freeze when governance enforcement is not verifiable", () => {
    const result = evaluateRuntimeConstitutionalResilience({
      governanceDisputes: [],
      stewardship: { governanceBlocked: true, shouldFreeze: true, survivabilityScore: 0.3 } as never,
      replayVerificationState: "VERIFIED",
      continuityConvergence: { divergenceScore: 0.5, continuityConfidence: 0.4, survivabilityConfidence: 0.35 } as never,
      operationalStabilityAssessment: { survivabilityScore: 0.4, escalationPressure: 0.5 } as never,
      escalationCoordination: { frozen: false, blocked: false } as never,
      generatedAt: "2026-05-09T00:00:00.000Z",
      continuityConfidence: 0.4,
      activeRecoveries: [],
      pendingApprovals: [],
      blockedRecoveries: [],
      quarantinedExecutions: [],
      leaseConflicts: [],
      auditHistory: [],
      degradedSystems: [],
      runtimeContinuityState: "DEGRADED",
      operationalStability: "degraded",
      replayDivergenceCount: 0,
      certificationState: "REJECTED",
      simulationOutcomes: [],
      continuityRiskScore: 50,
      recoveryPrioritization: null,
    } as never);

    expect(result.assessment.requiresFreeze).toBe(true);
  });
});
