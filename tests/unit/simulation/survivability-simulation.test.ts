import { describe, expect, it } from "vitest";

import { buildConstitutionalSimulation } from "@/services/simulation/constitutionalSimulationEngine";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

describe("survivability simulation", () => {
  it("preserves lineage across forecasts", () => {
    const dashboard = {
      runtimeContinuityState: "stable",
      continuityConfidence: 0.9,
      operationalStability: "stable",
      degradedSystems: [],
      activeRecoveries: [{ executionId: "exec_1" }],
      pendingApprovals: [],
      blockedRecoveries: [],
      quarantinedExecutions: [],
      replayVerificationState: "VERIFIED",
      replayDivergenceCount: 0,
      leaseConflicts: [],
      auditHistory: [{ id: "audit_1" }],
      governanceDisputes: [],
      certificationState: "VERIFIED",
      simulationOutcomes: [],
      continuityRiskScore: 0.1,
      stewardship: {
        state: "STEADY",
        confidence: 0.9,
        shouldFreeze: false,
        shouldContain: false,
        shouldEscalate: false,
        governanceBlocked: false,
        verificationBlocked: false,
        stabilizationStatus: "stable",
        survivabilityScore: 0.9,
        collapseRisk: "LOW",
        reasoning: [],
        evidence: [],
      },
      operationalStabilityAssessment: null,
      escalationCoordination: null,
      continuityConvergence: null,
      recoveryPrioritization: null,
      generatedAt: "2026-05-09T00:00:00.000Z",
    } satisfies RecoveryDashboardReadModel;

    const result = buildConstitutionalSimulation({ dashboard, nowMs: 11 });

    expect(result.results.every((entry) => entry.forecastLineageId.length > 0)).toBe(true);
  });
});
