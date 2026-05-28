import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  requireSessionUser: vi.fn(),
}));

vi.mock("@/src/server/auth/permissions", () => ({
  requireWorkspaceMember: vi.fn(),
}));

vi.mock("@/services/stewardship/stewardshipDashboardModel", () => ({
  buildStewardshipDashboardModel: vi.fn(),
}));

import { requireSessionUser } from "@/src/lib/auth";
import StewardshipOperationsPage from "@/app/operations/stewardship/page";
import { buildStewardshipDashboardModel } from "@/services/stewardship/stewardshipDashboardModel";

describe("StewardshipOperationsPage", () => {
  beforeEach(() => {
    vi.mocked(requireSessionUser).mockResolvedValue({
      id: "user_1",
      role: "admin",
      workspaceId: "workspace_1",
    } as never);
    vi.mocked(buildStewardshipDashboardModel).mockResolvedValue({
      stale: false,
      controlsHidden: true,
      sourceDashboard: { recoveryPrioritization: null },
      forecasting: {
        advisoryOnly: true,
        simulations: [],
        confidenceDegradationReasons: [],
        evidenceSufficient: true,
        collapseRisk: 0.2,
        containmentPressure: 0.3,
        governanceInstabilityRisk: 0.2,
        operationalTrustProjection: 0.7,
        generatedAt: "2026-05-09T00:00:00.000Z",
      },
      simulationAudit: [],
      auditReady: {},
      resilienceAudit: {},
      resilienceTelemetry: [],
      constitutionalAudit: {},
      decisionAudit: {},
      readinessAudit: {},
      decision: {
        decisionId: "decision_1",
        executionId: "exec_1",
        recommendedAction: "FREEZE",
        constitutionalAction: "DENY",
        constitutionallyAllowed: false,
        requiresApproval: true,
        requiresEscalation: true,
        requiresContainment: true,
        decisionConfidence: 0.24,
        governanceRisk: 0.92,
        continuityImpact: 0.81,
        riskScore: 0.91,
        uncertaintyLevel: "CRITICAL",
        reasons: ["governance_dispute_present"],
        blockedReasons: ["disputed_truth_blocks_recovery"],
        constitutionalViolations: ["disputed_truth_blocks_recovery"],
        forecastLineageIds: ["lineage_1"],
        mutable: false,
        generatedAt: "2026-05-09T00:00:00.000Z",
      },
      readiness: {
        readinessState: "GOVERNANCE_REVIEW_REQUIRED",
        readinessScore: 68,
        governanceConfidence: 0.76,
        simulationTrustScore: 0.72,
        rollbackConfidence: 0.81,
        containmentConfidence: 0.69,
        convergenceConfidence: 0.73,
        escalationReliability: 0.7,
        constitutionalIntegrity: 0.82,
        auditCompleteness: 0.77,
        recoveryIntelligenceStability: 0.66,
        requiresOperatorApproval: true,
        autonomyBlockedReasons: ["simulation_trust_below_threshold"],
        advisoryOnly: true,
        liveAutonomyEnabled: false,
        evaluatedDomains: ["GOVERNANCE", "SIMULATION", "CONSTITUTIONAL"],
        timestamp: "2026-05-09T00:00:00.000Z",
      },
      view: {
        runtimeStability: {
          operationalState: "UNSTABLE",
          survivabilityScore: 0.3,
          degradationRate: 0.7,
          recoveryPressure: 0.6,
          escalationPressure: 0.5,
          continuityConfidence: 0.25,
          unstableSubsystems: ["replay"],
          stabilizationRequired: true,
          timestamp: "2026-05-09T00:00:00.000Z",
        },
        recoveryStewardship: {
          supervisedRecoveries: ["exec_1"],
          blockedRecoveries: ["exec_2"],
          frozenRecoveryChains: ["chain_1"],
          disputedOperations: ["exec_3"],
          activeStabilizationOperations: ["stabilize_runtime"],
          recoveryPriorityOrder: ["exec_1"],
        },
        escalationGovernance: {
          escalationLineage: ["lineage_1"],
          emergencyEscalations: [],
          governanceEscalations: ["esc_1"],
          constitutionalDisputes: ["audit_integrity_disputed"],
          containmentStatus: "CONTAINMENT_REQUIRED",
        },
        convergence: {
          converged: false,
          divergenceScore: 0.7,
          divergenceReasons: ["replay_divergence"],
          requiresContainment: true,
          requiresEscalation: true,
          continuityConfidence: 0.25,
        },
        resilience: {
          resilienceState: "CONSTITUTIONALLY_FROZEN",
          survivabilityScore: 0.2,
          constitutionalIntegrityScore: 0.3,
          operationalRiskScore: 0.9,
          collapseProbability: 0.8,
          degradationVelocity: 0.6,
          governanceIntegrity: 0.4,
          continuityIntegrity: 0.3,
          escalationPressure: 0.6,
          stabilizationConfidence: 0.3,
          requiresContainment: true,
          requiresFreeze: true,
          requiresEscalation: true,
          requiresOperatorIntervention: true,
          disputedConditions: ["audit_integrity_disputed"],
          resilienceViolations: [],
          affectedSubsystems: ["replay"],
          generatedAt: "2026-05-09T00:00:00.000Z",
        },
        generatedAt: "2026-05-09T00:00:00.000Z",
      },
    } as never);
  });

  it("renders the read-dominant supervisory dashboard", async () => {
    const page = await StewardshipOperationsPage();
    render(page);

    expect(screen.getByText(/runtime constitutional resilience dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/constitutional enforcement/i)).toBeInTheDocument();
    expect(screen.getByText(/autonomous recovery readiness/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
