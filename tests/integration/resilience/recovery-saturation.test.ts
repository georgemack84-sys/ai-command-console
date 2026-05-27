import { describe, expect, it } from "vitest";

import { assessConstitutionalResilience } from "@/services/resilience/resilienceAssessment";

describe("recovery saturation", () => {
  it("raises operator intervention under saturated recoveries and approvals", () => {
    const result = assessConstitutionalResilience({
      continuityConfidence: 0.4,
      governanceDisputes: [],
      pendingApprovals: [{ executionId: "exec_1" }],
      activeRecoveries: [{ executionId: "exec_1" }, { executionId: "exec_2" }],
      replayVerificationState: "VERIFIED",
      operationalStabilityAssessment: { survivabilityScore: 0.41, escalationPressure: 0.66, recoveryPressure: 0.72 } as never,
      stewardship: { shouldFreeze: false, governanceBlocked: false, survivabilityScore: 0.45 } as never,
      continuityConvergence: { divergenceScore: 0.52, continuityConfidence: 0.42, survivabilityConfidence: 0.44 } as never,
      escalationCoordination: { frozen: false, blocked: false } as never,
      generatedAt: "2026-05-09T00:00:00.000Z",
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
      continuityRiskScore: 61,
      recoveryPrioritization: { governanceReviewRequired: true } as never,
    } as never);

    expect(result.assessment.requiresOperatorIntervention).toBe(true);
  });
});
