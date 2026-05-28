import { describe, expect, it } from "vitest";

import { buildConstitutionalSimulation } from "@/services/simulation/constitutionalSimulationEngine";
import type { RecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationTypes";

describe("operator intervention simulation", () => {
  it("exposes projected interventions without execution authority", () => {
    const dashboard = {
      runtimeContinuityState: "degraded",
      continuityConfidence: 0.45,
      operationalStability: "degraded",
      degradedSystems: ["operator-review"],
      activeRecoveries: [],
      pendingApprovals: [{ id: "approval_1" }],
      blockedRecoveries: [],
      quarantinedExecutions: [],
      replayVerificationState: "VERIFIED",
      replayDivergenceCount: 0,
      leaseConflicts: [],
      auditHistory: [{ id: "audit_1" }],
      governanceDisputes: [],
      certificationState: "REVIEW",
      simulationOutcomes: [],
      continuityRiskScore: 0.6,
      stewardship: {
        state: "REVIEW",
        confidence: 0.5,
        shouldFreeze: false,
        shouldContain: false,
        shouldEscalate: true,
        governanceBlocked: false,
        verificationBlocked: false,
        stabilizationStatus: "review",
        survivabilityScore: 0.48,
        collapseRisk: "MEDIUM",
        reasoning: [],
        evidence: [],
      },
      operationalStabilityAssessment: null,
      escalationCoordination: null,
      continuityConvergence: null,
      recoveryPrioritization: null,
      generatedAt: "2026-05-09T00:00:00.000Z",
    } satisfies RecoveryDashboardReadModel;

    const result = buildConstitutionalSimulation({ dashboard, nowMs: 13 });
    const forecast = result.results.find((entry) => entry.simulationType === "operator_intervention");

    expect(forecast?.projectedInterventions).toContain("operator_review_required");
  });
});
