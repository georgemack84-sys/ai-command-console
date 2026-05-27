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

import { requireSessionUser } from "@/src/lib/auth";
import ExecutiveOperationsPage from "@/app/operations/executive/page";
import { buildExecutiveOperationsAggregator } from "@/services/executive/executiveOperationsAggregator";

describe("ExecutiveOperationsPage", () => {
  beforeEach(() => {
    vi.mocked(requireSessionUser).mockResolvedValue({
      id: "user_1",
      role: "admin",
      workspaceId: "workspace_1",
    } as never);
    vi.mocked(buildExecutiveOperationsAggregator).mockResolvedValue({
      governancePressure: {
        governanceIntegrity: 0.68,
        escalationPressure: 0.55,
        approvalBacklog: 0.2,
        containmentPressure: 0.8,
        survivabilityPressure: 0.7,
        autonomyPressure: 0.5,
        operationalRisk: 0.6,
        constitutionalStability: 0.42,
      },
      survivabilityCard: {
        survivabilityState: "SURVIVABILITY_MODE",
        continuityConfidence: 0.58,
        collapseProbability: 0.46,
        stabilizationConfidence: 0.51,
        degradationVelocity: 0.63,
        strategicThreatLevel: 0.66,
        emergencyControlsActive: true,
      },
      strategicForecast: {
        forecastId: "f1",
        survivabilityProjection: 0.54,
        degradationTrend: 0.61,
        collapseRisk: 0.47,
        stabilizationProbability: 0.48,
        projectedContainmentLoad: 0.79,
        governanceStressProjection: 0.44,
        uncertaintyLevel: 0.32,
        generatedAt: 10,
      },
      escalation: {
        escalationTimeline: ["esc-1"],
        escalationRequired: true,
        escalationSaturation: 0.64,
        emergencyAutonomyFreeze: true,
        constitutionalFreezeVisible: true,
      },
      constraints: {
        governanceSafe: false,
        blockedReasons: ["executive_containment_required"],
      },
      controlPlane: {
        governance: { constitutionalState: "RESTRICTED" },
        sovereignty: { governanceIntegrity: 0.68 },
        dashboard: { pendingApprovals: [{ id: "approval_1" }] },
        disputeReview: { unresolvedDisputes: ["dispute_1"] },
        reviewEscalation: { escalationChain: ["esc-1"] },
        supervision: { supervisionState: "FROZEN" },
        survivability: {
          containment: {
            recommendedAction: "CONTAIN",
            containmentState: "CONTAINED",
            isolatedDomains: ["replay"],
            quarantinedDomains: [],
            degradedDomains: ["coordination"],
          },
          blockedReasons: ["executive_containment_required"],
          protocols: { protocols: ["preserve_audit_lineage"] },
          assessment: { systemicInstability: 0.72 },
          degradation: { autonomyLevel: "ADVISORY_ONLY" },
          emergencyStabilization: { required: true },
        },
        continuity: { survivabilityScore: 0.58 },
        coordination: {
          deniedActions: ["autonomous_execution"],
          requiredOversight: ["operator_review_required"],
        },
      },
      audit: {
        auditId: "a1",
      },
    } as never);
  });

  it("renders the executive dashboard as display-only infrastructure", async () => {
    const page = await ExecutiveOperationsPage();
    render(page);

    expect(screen.getByText(/executive constitutional operations dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^constitutional operations$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^strategic continuity$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^autonomous supervision$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^containment$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
