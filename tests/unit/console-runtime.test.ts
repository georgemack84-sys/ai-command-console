import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/services/policy-governance-service", () => ({
  getPolicyGovernanceSnapshot: vi.fn(),
  updateGovernanceSettings: vi.fn(),
}));

vi.mock("@/src/server/services/control-center-service", () => ({
  buildControlCenterOverview: vi.fn(),
}));

vi.mock("@/src/server/services/operations-action-service", () => ({
  executeOperationsAction: vi.fn(),
}));

vi.mock("@/src/server/services/terminal-collaboration-service", () => ({
  executeTerminalCollaborationAction: vi.fn(),
}));

vi.mock("@/src/server/services/terminal-digest-service", () => ({
  createTerminalDigest: vi.fn(),
}));

vi.mock("@/src/server/services/terminal-governance-compat-service", () => ({
  canHandleTerminalGovernanceCompatAction: vi.fn(),
  executeTerminalGovernanceCompatAction: vi.fn(),
}));

vi.mock("@/src/server/services/terminal-command-service", () => ({
  canHandleTerminalCommand: vi.fn(),
  executeTerminalCommand: vi.fn(),
}));

vi.mock("@/src/server/services/terminal-overview-service", () => ({
  buildTerminalOverviewSnapshot: vi.fn(() => ({
    system: {
      agentCount: 3,
      totalTasks: 9,
      queuedTasks: 4,
      claimedTasks: 2,
      completedTasks: 3,
      activeSchedules: 2,
      watcherEnabled: true,
    },
    health: {
      overall: "stable",
      queuePressure: "moderate",
      reviewPressure: "low",
      watcherStatus: "running",
    },
    queue: [{ id: "task_1", agentName: "researcher", status: "queued", description: "Follow up", createdAt: "2026-04-05T01:00:00.000Z" }],
    reviews: [],
    schedules: [],
    watcher: { enabled: true, intervalSeconds: 4, lastRunAt: null, lastError: null, ruleCount: 0, rules: [] },
    alerts: { activeCount: 1, items: [], all: [] },
    plugins: [],
    workload: [],
    agentDetails: [],
    trust: { lastWatcherRunAt: null, lastWatcherError: null, pendingReviews: 0, activeAlerts: 1, schedulesWithErrors: 0 },
    recommendations: [{ id: "alerts", title: "Triage active research signals", command: "alerts:active", tone: "critical" }],
    ownershipSignals: [{ id: "ownership:orphaned", title: "1 workspace item is unassigned", detail: "1 brief does not have an owner.", tone: "warning", command: "ownership:signals" }],
    activity: [{ timestamp: "2026-04-05T01:00:00.000Z", event: "system_activity", message: "Activity recorded." }],
    automation: {
      alertThresholds: { queuedTasksHigh: 6, pendingReviewsHigh: 4, inactiveAgentsHigh: 2 },
      policy: {
        escalation: {
          autoRunWatcherOnPolicySave: false,
          autoRunAlertsOnPolicySave: false,
          autoAcknowledgeWatcherStopped: false,
          preferredAlertOwner: "manager",
        },
        remediation: {
          allowScheduleRestartRecommendations: true,
          allowAlertResolutionRecommendations: true,
          allowReviewFollowupRecommendations: true,
        },
      },
    },
    telemetry: { totals: { events: 0, errors: 0, approvals: 0, avgCommandLatencyMs: 0, avgWatcherLatencyMs: 0, avgSchedulerLatencyMs: 0 }, recent: [], byType: [] },
    jobs: { total: 0, queued: 0, running: 0, failed: 0, metrics: { avgQueueWaitMs: 0, avgRunTimeMs: 0, completionRate: 0, retryPressure: 0, scheduledRetries: 0 }, items: [] },
  })),
  buildTerminalCollaborationSnapshot: vi.fn(() => ({
    currentUser: { id: "user_1", name: "Admin", email: "admin@example.com", role: "admin", workspaceId: "workspace_1" },
    sharedSessions: [{ id: "session_1", name: "Ops handoff", draftCommand: "inbox:list", sharedWith: ["team"] }],
    handoffs: [{ id: "handoff_1", title: "Escalate", assignedTo: "team", assignedByName: "Admin", note: "Review needed", status: "open" }],
    digestPreferences: { enabled: true, cadence: "daily", preferredChannel: "inbox", includeTrustReport: true, trustAudience: "self", trustEnvironment: "production", immediateOnTrustDrop: true },
    digestRuns: [{ id: "digest_1", createdAt: "2026-04-05T02:00:00.000Z", summary: "Digest summary", stats: { open: 1 }, highlights: [], report: "Trust report", reportType: "trust" }],
    digestScheduler: { enabled: true, intervalMs: 60000, lastRunAt: "2026-04-05T02:00:00.000Z", lastResult: { workspaceCount: 1, queuedJobCount: 1, queuedJobIds: ["job_1"] }, lastError: null },
    inbox: [{ id: "inbox:approval_1", type: "approval", title: "Approve resolved for Pulse Workspace", detail: "Waiting on approval.", status: "pending", read: false, acknowledged: false }],
    notificationHistory: [{ id: "inbox:approval_1", type: "approval", title: "Approve resolved for Pulse Workspace", detail: "Waiting on approval.", status: "pending", read: false, acknowledged: false }],
    notificationDigest: { open: 1, unread: 1, acknowledged: 0, ownership: 0, handoffs: 0, approvals: 1, trust: 0 },
  })),
}));

vi.mock("node:module", async () => {
  const actual = await vi.importActual<typeof import("node:module")>("node:module");
  return {
    ...actual,
    createRequire: () => (path: string) => {
      if (path.includes("legacyConsoleCompat")) {
        return {
          queueLegacyDueDigestSweepIfNeeded: vi.fn(),
          formatLegacyConsoleHelp: vi.fn(() => "Available Commands\n------------------\nhelp"),
        };
      }

      if (path.includes("permissions")) {
        return {
          canApproveInEnvironment: vi.fn(() => true),
          canManageGovernanceInEnvironment: vi.fn((role: string) => role === "admin"),
          getEnvironmentPolicy: vi.fn(() => ({
            minimumRoleForCommands: "operator",
            minimumRoleForApprovals: "approver",
            minimumRoleForGovernance: "admin",
          })),
        };
      }

      throw new Error(`Unexpected require path: ${path}`);
    },
  };
});

import { getPolicyGovernanceSnapshot, updateGovernanceSettings } from "@/src/server/services/policy-governance-service";
import { buildControlCenterOverview } from "@/src/server/services/control-center-service";
import { executeOperationsAction } from "@/src/server/services/operations-action-service";
import { executeTerminalCollaborationAction } from "@/src/server/services/terminal-collaboration-service";
import { createTerminalDigest } from "@/src/server/services/terminal-digest-service";
import {
  canHandleTerminalGovernanceCompatAction,
  executeTerminalGovernanceCompatAction,
} from "@/src/server/services/terminal-governance-compat-service";
import { canHandleTerminalCommand, executeTerminalCommand } from "@/src/server/services/terminal-command-service";
import { executeTerminalRequest, getTerminalOverview } from "@/src/server/services/console-runtime";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  email: "admin@example.com",
  name: "Admin",
  role: "admin" as const,
};

describe("console runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPolicyGovernanceSnapshot).mockResolvedValue({
      currentEnvironment: "production",
      sensitiveActionsRequireApproval: false,
      environmentPolicies: { production: { minimumRoleForGovernance: "admin" } },
      workspacePolicyOverrides: {},
      workspacePolicyPlaybooks: [],
      workspacePolicyPlaybookRollouts: [],
      defaultPolicyPlaybookPresets: [],
      demoScenario: null,
    } as never);
    vi.mocked(buildControlCenterOverview).mockResolvedValue({
      collaboration: {
        digestWorkspaceHealth: [
          {
            workspaceId: "workspace_1",
            workspaceName: "Pulse Workspace",
            incidentApprovalHistory: [
              {
                id: "approval_1",
                label: "Approve resolved for Pulse Workspace",
                status: "pending",
                requestedByName: "Admin",
                requestedStatus: "resolved",
                approverTarget: "role:admin",
                approvedByName: null,
                rejectedByName: null,
                resolvedAt: null,
                createdAt: new Date("2026-04-05T01:00:00.000Z").toISOString(),
              },
            ],
          },
        ],
        digestEscalations: [],
        globalOperations: { totals: { openIncidents: 1, completedTrustIncidents: 0 } },
        policyPlaybookAdoption: { totalTracked: 0, presetCount: 0, savedCount: 0, items: [], recommendations: [] },
        incidentApprovalPressure: [],
        approvalThroughput: { totals: { totalApprovals: 1 }, targets: [], workspaces: [] },
        approvalPolicyRecommendations: [],
        approvalRecommendationObservations: [],
        approvalTrustDashboard: { score: 90, alerts: [] },
        approvalTrustEnvironments: [{ environment: "production", score: 90, alertCount: 1, regressedCount: 0, improvedCount: 1 }],
        approvalTrustTrends: [{ environment: "production", deltas: { day: -2, week: 3, month: 8 } }],
        approvalTrustSignals: [{ id: "trust_1", title: "Production trust dipped", detail: "One regression needs attention." }],
        approvalRecommendationFamilies: [{ label: "Policy rollout", recommendationCount: 2, promotedCount: 1, rolledBackCount: 0, trustSignalCount: 1 }],
        completedTrustIncidents: [{ workspaceId: "workspace_1", workspaceName: "Pulse Workspace", environment: "production", archivedAt: "2026-04-05T01:00:00.000Z", summary: "Recovered" }],
        completedTrustEnvironments: [{ environment: "production", archivedCount: 1, latestArchivedAt: "2026-04-05T01:00:00.000Z", recentWorkspaces: ["Pulse Workspace"] }],
        environmentTrustRecaps: [{ environment: "production", score: 90, activeSignals: 1, completedArchived: 1, latestArchivedAt: "2026-04-05T01:00:00.000Z" }],
        automationFollowups: [],
        appliedApprovalPolicies: [],
        notificationDigest: { open: 1, unread: 1, acknowledged: 0, ownership: 0, handoffs: 0, approvals: 1, trust: 1 },
        inbox: [{ id: "inbox:approval_1", title: "Approve resolved for Pulse Workspace", type: "approval", status: "open" }],
        digestPreferences: { includeTrustReport: true, trustEnvironment: "production" },
      },
    } as never);
    vi.mocked(executeOperationsAction).mockResolvedValue({
      action: "collaboration:automation-set-status",
      output: "Updated incident status to resolved.",
    } as never);
    vi.mocked(executeTerminalCollaborationAction).mockResolvedValue({
      action: "collaboration:create-handoff",
      output: 'Created handoff "Escalate".',
    } as never);
    vi.mocked(createTerminalDigest).mockReturnValue({
      id: "digest_1",
      summary: "Digest summary",
      stats: { open: 1 },
      highlights: [],
      report: "Trust report",
      reportType: "trust",
      createdAt: new Date("2026-04-05T02:00:00.000Z").toISOString(),
    } as never);
    vi.mocked(canHandleTerminalCommand).mockReturnValue(false);
    vi.mocked(executeTerminalCommand).mockResolvedValue("terminal command output" as never);
    vi.mocked(canHandleTerminalGovernanceCompatAction).mockReturnValue(false);
    vi.mocked(executeTerminalGovernanceCompatAction).mockResolvedValue({
      ok: true,
      output: "compat action output",
    } as never);
  });

  it("overlays terminal governance from the Prisma-backed governance snapshot", async () => {
    const overview = await getTerminalOverview(actor);

    expect((overview as Record<string, unknown>).system).toEqual(
      expect.objectContaining({
        queuedTasks: 4,
        completedTasks: 3,
      }),
    );
    expect((overview as Record<string, unknown>).recommendations).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "alerts", command: "alerts:active" })]),
    );
    expect((overview as Record<string, unknown>).ownershipSignals).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "ownership:orphaned", command: "ownership:signals" })]),
    );
    expect(overview.collaboration).toEqual(
      expect.objectContaining({
        currentUser: expect.objectContaining({ name: "Admin", role: "admin" }),
        digestPreferences: expect.objectContaining({ enabled: true, trustEnvironment: "production" }),
        notificationDigest: expect.objectContaining({ open: 1, approvals: 1 }),
      }),
    );
    expect(overview.collaboration?.governance).toEqual(
      expect.objectContaining({
        currentEnvironment: "production",
        sensitiveActionsRequireApproval: false,
      }),
    );
    expect(overview.collaboration?.permissions).toEqual(
      expect.objectContaining({
        currentEnvironment: "production",
        canManageGovernance: true,
      }),
    );
    expect(overview.collaboration?.approvals).toEqual([
      expect.objectContaining({
        id: "approval_1",
        action: "collaboration:automation-set-status",
        requestedStatus: "resolved",
      }),
    ]);
  });

  it("persists governance updates through the Prisma-backed service", async () => {
    const result = await executeTerminalRequest(
      {
        action: "collaboration:update-governance",
        payload: { sensitiveActionsRequireApproval: true },
      },
      actor,
    );

    expect(updateGovernanceSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        currentEnvironment: "production",
        sensitiveActionsRequireApproval: true,
      }),
    );
    expect(result.ok).toBe(true);
  });

  it("routes terminal operations actions through the Prisma-backed operations service", async () => {
    const result = await executeTerminalRequest(
      {
        action: "collaboration:automation-set-status",
        payload: { workspaceId: "workspace_1", incidentStatus: "resolved" },
      },
      actor,
    );

    expect(executeOperationsAction).toHaveBeenCalledWith(
      {
        action: "collaboration:automation-set-status",
        payload: { workspaceId: "workspace_1", incidentStatus: "resolved" },
      },
      actor,
    );
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        output: "Updated incident status to resolved.",
      }),
    );
  });

  it("routes terminal collaboration actions through the dedicated collaboration service", async () => {
    const result = await executeTerminalRequest(
      {
        action: "collaboration:create-handoff",
        payload: { title: "Escalate", note: "Need operator review.", assignedTo: "team" },
      },
      actor,
    );

    expect(executeTerminalCollaborationAction).toHaveBeenCalledWith(
      {
        action: "collaboration:create-handoff",
        payload: { title: "Escalate", note: "Need operator review.", assignedTo: "team" },
      },
      actor,
      expect.objectContaining({
        collaboration: expect.objectContaining({
          approvals: expect.any(Array),
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        output: 'Created handoff "Escalate".',
      }),
    );
  });

  it("renders inbox:list from the merged terminal overview instead of the legacy command formatter", async () => {
    const result = await executeTerminalRequest(
      {
        command: "inbox:list",
      },
      actor,
    );

    expect(result.ok).toBe(true);
    expect(result.output).toContain("Operator inbox");
    expect(result.output).toContain("Approve resolved for Pulse Workspace");
  });

  it("renders trust:report from the merged terminal overview", async () => {
    const result = await executeTerminalRequest(
      {
        command: "trust:report",
      },
      actor,
    );

    expect(result.ok).toBe(true);
    expect(result.output).toContain("Trust report");
    expect(result.output).toContain("Environment summary");
    expect(result.output).toContain("Pulse Workspace");
  });

  it("routes extracted terminal commands through the dedicated command service", async () => {
    vi.mocked(canHandleTerminalCommand).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        command: "agents:list",
      },
      actor,
    );

    expect(executeTerminalCommand).toHaveBeenCalledWith("agents:list", actor);
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        output: "terminal command output",
      }),
    );
  });

  it("allows only explicit legacy command fallback paths", async () => {
    const result = await executeTerminalRequest(
      {
        command: "help",
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        output: expect.stringContaining("Available Commands"),
      }),
    );
  });

  it("rejects unknown terminal commands instead of falling through the legacy handler", async () => {
    const result = await executeTerminalRequest(
      {
        command: "totally:unknown-command",
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Unsupported terminal command: totally:unknown-command.",
      }),
    );
  });

  it("routes digest generation through the dedicated terminal digest service", async () => {
    const result = await executeTerminalRequest(
      {
        action: "collaboration:digest-generate",
      },
      actor,
    );

    expect(createTerminalDigest).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({
        collaboration: expect.objectContaining({
          notificationDigest: expect.any(Object),
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        output: "Generated digest digest_1.",
      }),
    );
  });

  it("rejects unknown terminal actions instead of silently falling through the legacy handler", async () => {
    const result = await executeTerminalRequest(
      {
        action: "totally:unknown-action",
        payload: {},
      },
      actor,
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Unsupported terminal action: totally:unknown-action.",
      }),
    );
  });

  it("routes the last governance compatibility actions through the extracted service", async () => {
    vi.mocked(canHandleTerminalGovernanceCompatAction).mockReturnValue(true);

    const result = await executeTerminalRequest(
      {
        action: "collaboration:acknowledge-trust-alert",
        payload: { alertId: "trust_1" },
      },
      actor,
    );

    expect(executeTerminalGovernanceCompatAction).toHaveBeenCalledWith(
      {
        action: "collaboration:acknowledge-trust-alert",
        payload: { alertId: "trust_1" },
      },
      actor,
    );
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        output: "compat action output",
      }),
    );
  });
});
