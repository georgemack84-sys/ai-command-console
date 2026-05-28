import { describe, expect, it } from "vitest";

import { buildConstitutionalSimulation } from "@/services/simulation/constitutionalSimulationEngine";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

describe("escalation cascade simulation", () => {
  it("surfaces escalation risk deterministically", () => {
    const dashboard = {
      runtimeContinuityState: "unstable",
      continuityConfidence: 0.6,
      operationalStability: "unstable",
      degradedSystems: ["escalation"],
      activeRecoveries: [],
      pendingApprovals: [],
      blockedRecoveries: [],
      quarantinedExecutions: [],
      replayVerificationState: "VERIFIED",
      replayDivergenceCount: 0,
      leaseConflicts: [],
      auditHistory: [{ id: "audit_1" }],
      governanceDisputes: [],
      certificationState: "WATCH",
      simulationOutcomes: [],
      continuityRiskScore: 0.5,
      stewardship: {
        state: "WATCH",
        confidence: 0.7,
        shouldFreeze: false,
        shouldContain: false,
        shouldEscalate: true,
        governanceBlocked: false,
        verificationBlocked: false,
        stabilizationStatus: "watch",
        survivabilityScore: 0.65,
        collapseRisk: "MEDIUM",
        reasoning: [],
        evidence: [],
      },
      operationalStabilityAssessment: null,
      escalationCoordination: {
        escalationId: "esc_1",
        escalationType: "governance",
        escalationState: "ACTIVE",
        escalationSeverity: "MEDIUM",
        escalationLineageId: "lineage_1",
        conflictingEscalations: [],
        requiresContainment: false,
        requiresOperatorVisibility: true,
        frozen: false,
        blocked: false,
        recommendedActions: [],
        confidence: 0.4,
        evidenceCount: 1,
        reason: "growth",
        source: "test",
        timestamp: "2026-05-09T00:00:00.000Z",
      },
      continuityConvergence: null,
      recoveryPrioritization: null,
      generatedAt: "2026-05-09T00:00:00.000Z",
    } satisfies RecoveryDashboardReadModel;

    const result = buildConstitutionalSimulation({ dashboard, nowMs: 12 });
    const forecast = result.results.find((entry) => entry.simulationType === "escalation_cascade");

    expect(forecast?.escalationRisk).toBeGreaterThan(0.5);
  });
});
