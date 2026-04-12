import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/services/control-center-service", () => ({
  buildControlCenterOverview: vi.fn(),
}));

import { GET } from "@/app/api/control-center/overview/route";
import { getSessionUser } from "@/src/lib/auth";
import { buildControlCenterOverview } from "@/src/server/services/control-center-service";

describe("control center overview route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Prisma-backed overview data for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });

    vi.mocked(buildControlCenterOverview).mockResolvedValue({
      activity: [],
      telemetry: {
        totals: {
          events: 0,
          errors: 0,
          avgCommandLatencyMs: 0,
          avgWatcherLatencyMs: 0,
          avgSchedulerLatencyMs: 0,
        },
        byType: [],
        recent: [],
      },
      jobs: {
        total: 0,
        queued: 0,
        running: 0,
        failed: 0,
        health: {
          activeWorkers: 2,
          pending: 98,
          saturated: true,
          maxPendingJobs: 100,
          maxRunningJobs: 12,
          staleRunning: 1,
          unhealthy: true,
        },
        metrics: {
          avgQueueWaitMs: 0,
          avgRunTimeMs: 0,
          completionRate: 0,
          retryPressure: 0,
          scheduledRetryCount: 0,
        },
        items: [],
      },
      collaboration: {
        digestScheduler: {
          enabled: false,
          intervalMs: 60_000,
          lastRunAt: null,
          lastError: null,
          lastResult: null,
        },
        digestEscalations: [],
        globalOperations: {
          totals: {
            workspaceCount: 0,
            overriddenWorkspaces: 0,
            unhealthyWorkspaces: 0,
            openIncidents: 0,
            pendingApprovals: 0,
            finalEscalations: 0,
            activeTrustSignals: 0,
            activeDigestEscalations: 0,
            completedTrustIncidents: 0,
            playbookRollouts: 0,
          },
          environments: [],
          hotspots: [],
          pressureTargets: [],
          playbookRollouts: [],
        },
        approvalTrustEnvironments: [],
        approvalTrustTrends: [],
        approvalTrustSignals: [],
        appliedApprovalPolicies: [],
        policyPlaybookAdoption: {
          totalTracked: 0,
          presetCount: 0,
          savedCount: 0,
          items: [],
          recommendations: [],
        },
        digestWorkspaceHealth: [],
        incidentApprovalPressure: [],
        approvalThroughput: {
          totals: {
            totalApprovals: 0,
            manualReroutes: 0,
            autoReroutes: 0,
            resolvedApprovals: 0,
          },
          targets: [],
          workspaces: [],
        },
        approvalPolicyRecommendations: [],
        approvalRecommendationObservations: [],
        approvalTrustDashboard: {
          score: 100,
          regressedCount: 0,
          improvedCount: 0,
          rolledBackCount: 0,
          observingCount: 0,
          cooldownCount: 0,
          alerts: [],
        },
        approvalRecommendationFamilies: [],
        completedTrustIncidents: [],
        completedTrustEnvironments: [],
        environmentTrustRecaps: [],
        automationFollowups: [],
        governance: {
          currentEnvironment: "development",
          sensitiveActionsRequireApproval: true,
          workspacePolicyOverrides: {},
          environmentPolicies: {},
          workspacePolicyPlaybooks: [],
          workspacePolicyPlaybookRollouts: [],
          defaultPolicyPlaybookPresets: [],
        },
      },
    } as never);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.overview.jobs.health).toEqual({
      activeWorkers: 2,
      pending: 98,
      saturated: true,
      maxPendingJobs: 100,
      maxRunningJobs: 12,
      staleRunning: 1,
      unhealthy: true,
    });
    expect(buildControlCenterOverview).toHaveBeenCalledWith({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
  });

  it("rejects anonymous access", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });
});
