import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:module", async () => {
  const actual = await vi.importActual<typeof import("node:module")>("node:module");
  return {
    ...actual,
    createRequire: () => (path: string) => {
      if (path.includes("digestScheduler")) {
        return {
          getDigestSchedulerStatus: vi.fn(() => ({
            enabled: false,
            intervalMs: 60_000,
            lastRunAt: null,
            lastError: null,
            lastResult: null,
          })),
        };
      }

      throw new Error(`Unexpected require path: ${path}`);
    },
  };
});

vi.mock("@/src/server/db/prisma", () => ({
  prisma: {
    workspace: {
      findMany: vi.fn(),
    },
    activityEvent: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/src/lib/server/runtime", () => ({
  getRuntimePosture: vi.fn(() => ({
    environment: "production",
  })),
}));

vi.mock("@/src/server/jobs/background-jobs", () => ({
  readBackgroundJobs: vi.fn(() => ({
    items: [],
    metrics: {
      avgQueueWaitMs: 0,
      avgRunTimeMs: 0,
      completionRate: 1,
      retryPressure: 0,
      scheduledRetries: 0,
    },
    health: {
      activeWorkers: 0,
      pending: 0,
      saturated: false,
      maxPendingJobs: 100,
      maxRunningJobs: 12,
      staleRunning: 0,
      unhealthy: false,
    },
  })),
}));

vi.mock("@/src/server/services/workspace-operations-state-service", () => ({
  buildDefaultChecklist: vi.fn((checklist) => checklist || []),
}));

vi.mock("@/src/server/services/policy-governance-service", () => ({
  getPolicyGovernanceSnapshot: vi.fn(async () => ({
    currentEnvironment: "production",
    sensitiveActionsRequireApproval: true,
    environmentPolicies: {
      production: {
        requireChecklistForResolved: true,
        requiredChecklistForResolved: ["summary_generated"],
        requireSummaryShareBeforeArchived: true,
        requireApprovalForResolved: true,
        requireApprovalForArchived: true,
        incidentApprovalReminderMinutes: 5,
        incidentApprovalEscalationMinutes: 15,
        incidentApprovalEscalationTarget: "role:admin",
        incidentApprovalFinalEscalationMinutes: 30,
        incidentApprovalFinalEscalationTarget: "team",
        incidentApprovalCapacityLimit: 1,
        trustDropAction: "followup",
        trustDropFollowupOwner: "Jamie Lead",
        promoteTrustDropToIncident: true,
      },
    },
    workspacePolicyOverrides: {},
    workspacePolicyPlaybooks: [],
    workspacePolicyPlaybookRollouts: [],
    defaultPolicyPlaybookPresets: [],
    demoScenario: null,
  })),
  saveWorkspacePolicyOverride: vi.fn(),
  updateGovernanceSettings: vi.fn(),
}));

import { prisma } from "@/src/server/db/prisma";
import { readBackgroundJobs } from "@/src/server/jobs/background-jobs";
import { buildControlCenterOverview } from "@/src/server/services/control-center-service";

function makeWorkspace(input: {
  id: string;
  name: string;
  status: string;
  updatedAt?: Date;
}) {
  const updatedAt = input.updatedAt ?? new Date("2026-04-05T10:00:00.000Z");
  return {
    id: input.id,
    name: input.name,
    description: `${input.name} workspace`,
    updatedAt,
    members: [
      {
        role: "owner",
        user: {
          id: "user_1",
          name: "Owner",
          email: "owner@example.com",
          role: "admin",
        },
      },
    ],
    updates: [],
    insights: [],
    activity: [],
    reports: [],
    operationsState: {
      workspaceId: input.id,
      incidentStatus: input.status,
      incidentChecklist: [],
      resolutionCompletedAt:
        input.status === "resolved" || input.status === "shared" || input.status === "archived" ? updatedAt : null,
    },
    operationsFollowups: [],
    incidentApprovals: [],
  };
}

describe("control-center service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.workspace.findMany).mockResolvedValue([
      makeWorkspace({ id: "workspace_open", name: "Open Workspace", status: "investigating" }),
      makeWorkspace({ id: "workspace_resolved", name: "Resolved Workspace", status: "resolved" }),
      makeWorkspace({ id: "workspace_shared", name: "Shared Workspace", status: "shared" }),
    ] as never);
    vi.mocked(prisma.activityEvent.findMany).mockResolvedValue([] as never);
  });

  it("counts resolved and shared workspaces as completed incidents instead of open incidents", async () => {
    const overview = await buildControlCenterOverview({
      id: "admin_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_open",
      workspaceName: "Open Workspace",
    });

    expect(overview.collaboration.globalOperations.totals.openIncidents).toBe(1);
    expect(overview.collaboration.globalOperations.totals.completedTrustIncidents).toBe(2);
    expect(overview.collaboration.completedTrustIncidents.map((item) => item.workspaceId)).toEqual([
      "workspace_resolved",
      "workspace_shared",
    ]);
  });

  it("surfaces queue saturation posture for platform operator controls", async () => {
    vi.mocked(readBackgroundJobs).mockReturnValue({
      items: [],
      metrics: {
        avgQueueWaitMs: 12,
        avgRunTimeMs: 340,
        completionRate: 0.92,
        retryPressure: 0.15,
        scheduledRetries: 4,
      },
      health: {
        activeWorkers: 2,
        pending: 100,
        saturated: true,
        maxPendingJobs: 100,
        maxRunningJobs: 12,
        staleRunning: 1,
        unhealthy: true,
      },
    } as never);

    const overview = await buildControlCenterOverview({
      id: "admin_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_open",
      workspaceName: "Open Workspace",
    });

    expect(overview.jobs.health).toMatchObject({
      activeWorkers: 2,
      pending: 100,
      saturated: true,
      maxPendingJobs: 100,
      maxRunningJobs: 12,
      staleRunning: 1,
      unhealthy: true,
    });
  });
});
