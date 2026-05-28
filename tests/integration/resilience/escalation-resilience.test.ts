import { describe, expect, it } from "vitest";

import { evaluateRuntimeConstitutionalResilience } from "@/services/resilience/runtimeConstitutionalResilience";

describe("escalation resilience", () => {
  it("does not suppress unstable escalation lineage", () => {
    const result = evaluateRuntimeConstitutionalResilience({
      governanceDisputes: [],
      stewardship: { governanceBlocked: false, survivabilityScore: 0.5 } as never,
      replayVerificationState: "VERIFIED",
      continuityConvergence: { divergenceScore: 0.55, continuityConfidence: 0.45, survivabilityConfidence: 0.48 } as never,
      operationalStabilityAssessment: { survivabilityScore: 0.45, escalationPressure: 0.7 } as never,
      escalationCoordination: { frozen: true, blocked: false, escalationType: "governance" } as never,
      generatedAt: "2026-05-09T00:00:00.000Z",
      continuityConfidence: 0.45,
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
      continuityRiskScore: 58,
      recoveryPrioritization: null,
    } as never);

    expect(result.assessment.resilienceViolations).toContain("escalation_chain_frozen");
  });
});
