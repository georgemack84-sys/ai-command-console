import { describe, expect, it } from "vitest";

import { evaluateRuntimeConstitutionalResilience } from "@/services/resilience/runtimeConstitutionalResilience";

describe("continuity resilience", () => {
  it("recommends containment when continuity convergence requires it", () => {
    const result = evaluateRuntimeConstitutionalResilience({
      continuityConfidence: 0.3,
      governanceDisputes: [],
      replayVerificationState: "VERIFIED",
      operationalStabilityAssessment: { survivabilityScore: 0.4, escalationPressure: 0.4, containmentRecommended: true } as never,
      stewardship: { shouldFreeze: false, governanceBlocked: false, survivabilityScore: 0.5 } as never,
      continuityConvergence: { requiresContainment: true, divergenceScore: 0.6, survivabilityConfidence: 0.45, continuityConfidence: 0.3 } as never,
      escalationCoordination: { frozen: false, blocked: false } as never,
      generatedAt: "2026-05-09T00:00:00.000Z",
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
      certificationState: "CERTIFIED_WITH_WARNINGS",
      simulationOutcomes: [],
      continuityRiskScore: 55,
      recoveryPrioritization: null,
    } as never);

    expect(result.assessment.requiresContainment).toBe(true);
  });
});
