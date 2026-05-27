import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  requireSessionUser: vi.fn(),
}));

vi.mock("@/src/server/auth/permissions", () => ({
  requireWorkspaceMember: vi.fn(),
}));

vi.mock("@/services/controlPlane/constitutionalOperatorControlPlane", () => ({
  buildConstitutionalOperatorControlPlane: vi.fn(),
}));

import { requireSessionUser } from "@/src/lib/auth";
import GovernanceOperationsPage from "@/app/governance/operations/page";
import { buildConstitutionalOperatorControlPlane } from "@/services/controlPlane/constitutionalOperatorControlPlane";

describe("GovernanceOperationsPage", () => {
  beforeEach(() => {
    vi.mocked(requireSessionUser).mockResolvedValue({
      id: "user_1",
      role: "admin",
      workspaceId: "workspace_1",
    } as never);
    vi.mocked(buildConstitutionalOperatorControlPlane).mockResolvedValue({
      governance: { constitutionalState: "RESTRICTED", governanceConfidence: 0.7, requiredApprovals: ["operator_approval"], violations: [] },
      sovereignty: {
        sovereigntyState: "UNSTABLE",
        governanceIntegrity: 0.68,
        survivabilityConfidence: 0.61,
        systemicRisk: 0.41,
        containmentEffectiveness: 0.72,
        escalationPressure: 0.44,
        emergencyControlsRequired: false,
        unstableDomains: ["replay"],
      },
      continuity: { continuityTrajectory: "WATCH" },
      enforcement: {
        containmentApplied: false,
        enforcementState: "EXECUTION_SUPPRESSED",
        blockedReasons: ["approval_required"],
        emergencyLockActive: false,
        auditRecord: { auditRef: "enforcement:1" },
      },
      dashboard: {
        replayVerificationState: "VERIFIED",
        governanceDisputes: [],
      },
      coordination: {
        route: ["governance_validation"],
        approvedActions: [],
        deniedActions: ["approval_required"],
        requiredOversight: ["operator"],
      },
      reviewEscalation: { escalationChain: [] },
      coordinationReview: { blockedReasons: [] },
      supervision: { stabilizationRecommended: true },
      evidenceReview: { evidenceReferences: ["audit_1"] },
      disputeReview: { unresolvedDisputes: [] },
      replayReview: { blockedReasons: [] },
      reviewQueue: [{ reviewId: "review_1" }],
      simulation: {
        results: [{
          simulationId: "simulation_1",
          simulationType: "governance_conflict",
          deterministic: true,
          constitutionalSafe: true,
          uncertaintyLevel: 0.2,
          survivabilityScore: 0.7,
          escalationRisk: 0.3,
          containmentFailureProbability: 0.2,
          governanceIntegrityForecast: 0.7,
          unstableDomains: [],
          projectedInterventions: [],
          forecastLineageId: "lineage_1",
          evidenceReferences: ["audit_1"],
          createdAt: 1,
        }],
      },
      controlPlaneGovernance: { blockedReasons: [] },
      survivability: {
        assessment: {
          survivabilityState: "DEGRADED",
          governanceContinuity: 0.64,
          auditPreservationConfidence: 0.78,
          recoverabilityConfidence: 0.59,
        },
        containment: {
          containmentState: "CONTAINED",
          recommendedAction: "CONTAIN",
          containmentEffectiveness: 0.71,
          containmentRequired: true,
          operatorInterventionRequired: true,
          isolatedDomains: ["replay"],
          quarantinedDomains: [],
          degradedDomains: ["replay"],
        },
        degradation: {
          degradationMode: "SURVIVABILITY_MODE",
          autonomyLevel: "ASSISTIVE",
        },
        blockedReasons: ["approval_required"],
        emergencyStabilization: {
          required: false,
          stabilizationState: "STABLE",
          bypassAllowed: false,
          blockedReasons: [],
        },
      },
    } as never);
  });

  it("renders all required governance panels without direct controls", async () => {
    const page = await GovernanceOperationsPage();
    render(page);

    expect(screen.getByText(/constitutional operator review and simulation control plane/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /constitutional status/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /autonomous coordination/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /sovereignty risk/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /constitutional audit/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /constitutional simulation/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /survivability state/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /containment status/i })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
