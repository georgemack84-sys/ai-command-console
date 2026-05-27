import { describe, expect, it } from "vitest";

import { buildConstitutionalSimulation } from "@/services/simulation/constitutionalSimulationEngine";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

describe("containment failure simulation", () => {
  it("projects containment risk without mutating runtime truth", () => {
    const dashboard = {
      runtimeContinuityState: "unstable",
      continuityConfidence: 0.4,
      operationalStability: "unstable",
      degradedSystems: ["containment"],
      activeRecoveries: [],
      pendingApprovals: [],
      blockedRecoveries: [],
      quarantinedExecutions: [],
      replayVerificationState: "VERIFIED",
      replayDivergenceCount: 0,
      leaseConflicts: [],
      auditHistory: [{ id: "audit_1" }],
      governanceDisputes: [],
      certificationState: "REVIEW",
      simulationOutcomes: [],
      continuityRiskScore: 0.7,
      stewardship: {
        state: "UNSTABLE",
        confidence: 0.5,
        shouldFreeze: false,
        shouldContain: true,
        shouldEscalate: true,
        governanceBlocked: false,
        verificationBlocked: false,
        stabilizationStatus: "watch",
        survivabilityScore: 0.4,
        collapseRisk: "HIGH",
        reasoning: [],
        evidence: [],
      },
      operationalStabilityAssessment: null,
      escalationCoordination: null,
      continuityConvergence: null,
      recoveryPrioritization: null,
      generatedAt: "2026-05-09T00:00:00.000Z",
    } satisfies RecoveryDashboardReadModel;

    const result = buildConstitutionalSimulation({ dashboard, nowMs: 10 });
    const forecast = result.results.find((entry) => entry.simulationType === "containment_failure");

    expect(forecast?.containmentFailureProbability).toBeGreaterThan(0);
    expect(result.readOnly).toBe(true);
  });
});
