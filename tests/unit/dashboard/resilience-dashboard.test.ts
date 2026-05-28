import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  requireSessionUser: vi.fn(),
}));

vi.mock("@/src/server/auth/permissions", () => ({
  requireWorkspaceMember: vi.fn(),
}));

vi.mock("@/services/executive/executiveOperationsAggregator", () => ({
  buildExecutiveOperationsAggregator: vi.fn(),
}));

vi.mock("@/services/resilience/constitutionalResilienceEngine", () => ({
  buildConstitutionalResilienceEngine: vi.fn(),
}));

vi.mock("@/services/readiness/constitutionalReadiness", () => ({
  evaluateConstitutionalReadiness: vi.fn(),
}));

import { requireSessionUser } from "@/src/lib/auth";
import ResilienceOperationsPage from "@/app/operations/resilience/page";
import { buildExecutiveOperationsAggregator } from "@/services/executive/executiveOperationsAggregator";
import { buildConstitutionalResilienceEngine } from "@/services/resilience/constitutionalResilienceEngine";
import { evaluateConstitutionalReadiness } from "@/services/readiness/constitutionalReadiness";

describe("ResilienceOperationsPage", () => {
  beforeEach(() => {
    vi.mocked(requireSessionUser).mockResolvedValue({
      id: "user_1",
      role: "admin",
      workspaceId: "workspace_1",
    } as never);

    vi.mocked(buildExecutiveOperationsAggregator).mockResolvedValue({
      governancePressure: {
        governanceIntegrity: 0.76,
        escalationPressure: 0.46,
        approvalBacklog: 0.2,
        containmentPressure: 0.7,
        survivabilityPressure: 0.62,
        autonomyPressure: 0.3,
        operationalRisk: 0.48,
        constitutionalStability: 0.71,
      },
      survivabilityCard: {
        survivabilityState: "DEGRADED",
        continuityConfidence: 0.67,
        collapseProbability: 0.32,
        stabilizationConfidence: 0.59,
        degradationVelocity: 0.44,
        strategicThreatLevel: 0.41,
        emergencyControlsActive: false,
      },
      strategicForecast: {
        forecastId: "forecast-1",
        survivabilityProjection: 0.64,
        degradationTrend: 0.48,
        collapseRisk: 0.32,
        stabilizationProbability: 0.6,
        projectedContainmentLoad: 0.56,
        governanceStressProjection: 0.34,
        uncertaintyLevel: 0.18,
        generatedAt: 10,
      },
      constraints: { governanceSafe: true, blockedReasons: [] },
      controlPlane: {
        governance: { constitutionalState: "RESTRICTED", governanceConfidence: 0.76 },
        continuity: { survivabilityScore: 0.67 },
        sovereignty: { governanceIntegrity: 0.76 },
        survivability: {
          containment: {
            containmentState: "CONTAINED",
            recommendedAction: "CONTAIN",
            isolatedDomains: ["replay"],
            quarantinedDomains: [],
            degradedDomains: ["coordination"],
            containmentEffectiveness: 0.74,
          },
          assessment: { systemicInstability: 0.42 },
          blockedReasons: [],
        },
        dashboard: { pendingApprovals: [{ id: "approval-1" }] },
      },
    } as never);

    vi.mocked(buildConstitutionalResilienceEngine).mockReturnValue({
      assessment: {
        resilienceState: "READINESS_REVIEW",
        constitutionalIntegrity: 0.76,
        governanceContinuity: 0.72,
        operationalViability: 0.66,
        containmentEffectiveness: 0.74,
        auditPreservationConfidence: 0.88,
        escalationPressure: 0.46,
        systemicInstability: 0.42,
        recoverabilityConfidence: 0.61,
        isolatedDomains: ["replay"],
        failingDomains: ["coordination"],
        survivableDomains: ["governance"],
        emergencyControlsRequired: false,
        operatorInterventionRequired: true,
        constitutionalRiskDetected: false,
        createdAt: 10,
        readinessCompatible: true,
      },
      continuity: {
        mode: "GOVERNANCE_PROTECTED",
        protectedDomains: ["governance"],
        frozenDomains: ["replay"],
        isolatedDomains: ["replay"],
        continuityPreserved: true,
      },
      collapsePrevention: {
        preventionEventId: "prevention-1",
        collapseRisk: 0.32,
        protectedDomains: ["governance"],
        containmentActions: ["CONTAIN"],
        escalationActions: ["operator_review_required"],
        survivabilityResult: "READINESS_REVIEW",
        advisoryOnly: true,
        createdAt: 10,
      },
      emergencyContinuity: {
        advisoryOnly: true,
        executionAuthorized: false,
        recommendedActions: ["preserve_audit_lineage"],
      },
      protocols: {
        protocols: ["preserve_audit_lineage"],
      },
      protectedOperations: {
        protectedDomains: ["governance"],
        frozenSystems: ["replay"],
        isolatedSystems: ["replay"],
        governanceProtectedSystems: ["governance"],
        continuityPreservedSystems: ["governance"],
      },
      telemetry: { generatedAt: 10 },
      audit: { advisoryOnly: true },
      blockedReasons: [],
    } as never);

    vi.mocked(evaluateConstitutionalReadiness).mockReturnValue({
      assessment: {
        readinessState: "OPERATOR_REVIEW_REQUIRED",
        governanceReliability: 0.76,
        auditIntegrity: 0.88,
        containmentSurvivability: 0.74,
        escalationCoordinationReliability: 0.71,
        simulationTrustworthiness: 0.82,
        continuityStability: 0.67,
        operatorOverrideReliability: 0.8,
        enforcementConsistency: 0.78,
        operationalExplainability: 0.81,
        deterministicRecoveryConfidence: 0.77,
        readinessConfidence: 0.77,
        blockingRisks: [],
        warnings: ["operator_review_required"],
        requiredOperatorActions: ["review_readiness_constraints"],
        autonomyPromotionAllowed: false,
        advisoryOnly: true,
        constitutionalSafe: true,
        generatedAt: 10,
      },
      drifts: [],
      confidenceLineage: [],
      dependencyGraph: {
        nodes: ["Governance", "Containment", "Continuity", "Recovery", "Readiness"],
        trace: () => ["Governance", "Containment", "Continuity", "Recovery", "Readiness"],
      },
      review: {
        requiresOperatorReview: true,
        recommendedActions: ["review_readiness_constraints"],
      },
      audit: { advisoryOnly: true },
    } as never);
  });

  it("renders the resilience dashboard as display-only infrastructure", async () => {
    const page = await ResilienceOperationsPage();
    render(page);

    expect(screen.getByText(/constitutional resilience, continuity and readiness architecture/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /constitutional integrity/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /readiness validation/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /survivability risk/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /protected systems/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /emergency continuity/i })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
