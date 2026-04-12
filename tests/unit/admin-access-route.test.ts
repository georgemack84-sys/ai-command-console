import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/services/admin-service", () => ({
  listAdminAccessPayload: vi.fn(),
  listAdminIncidentApprovals: vi.fn(),
  runAdminAiSummaryCheck: vi.fn(),
  updateUserRole: vi.fn(),
  updateUserStatus: vi.fn(),
  moveUserToWorkspace: vi.fn(),
  renameWorkspace: vi.fn(),
  createAdminWorkspaceInvite: vi.fn(),
  revokeAdminWorkspaceInvite: vi.fn(),
}));

vi.mock("@/src/server/services/control-center-service", () => ({
  saveControlCenterGovernance: vi.fn((value) => value),
  saveControlCenterWorkspacePolicy: vi.fn((_workspaceId, policyOverride, reset) =>
    reset ? { workspacePolicyOverrides: {} } : { workspacePolicyOverrides: { workspace_2: policyOverride } },
  ),
}));

vi.mock("@/src/server/services/policy-governance-service", () => ({
  getPolicyGovernanceSnapshot: vi.fn(async () => ({
    currentEnvironment: "staging",
    sensitiveActionsRequireApproval: false,
    environmentPolicies: { staging: { incidentApprovalCapacityLimit: 2 } },
    workspacePolicyOverrides: { workspace_2: { trustDropAction: "notify" } },
    workspacePolicyPlaybooks: [{ id: "playbook_1", name: "Staging Hardening", environment: "staging" }],
    workspacePolicyPlaybookRollouts: [],
    defaultPolicyPlaybookPresets: [{ id: "preset-prod", name: "Production", environment: "production" }],
    demoScenario: { id: "control-plane", name: "Control Plane Story", description: "Demo" },
  })),
}));

vi.mock("@/src/server/services/admin-access-runtime", () => ({
  loadAdminAccessRuntimeContext: vi.fn(() => ({
    collaboration: {
      governance: {
        currentEnvironment: "staging",
        sensitiveActionsRequireApproval: false,
      },
      approvals: [{ id: "approval_1", label: "Approve", requestedByName: "Admin", status: "pending", createdAt: new Date().toISOString() }],
    },
    audit: [{ id: "audit_1", timestamp: new Date().toISOString(), type: "admin:governance-updated", message: "Updated governance." }],
    diagnostics: {
      summary: { total: 1, errors: 0, warnings: 1, byScope: { platform: 1 }, latestAt: new Date().toISOString() },
      recent: [{ id: "diag_1", timestamp: new Date().toISOString(), level: "warning", scope: "platform", message: "Test warning" }],
    },
    aiSummaryReliability: {
      status: "warning",
      totals: { total: 2, successes: 1, fallbacks: 1, retries: 0, errors: 0 },
      latestAt: new Date().toISOString(),
      latestSuccessAt: new Date().toISOString(),
      latestFallbackAt: new Date().toISOString(),
      recentSuccessRate: 50,
      recentFailureRate: 0,
      recentFallbackRate: 50,
      trend: {
        successRateDelta: 10,
        failureRateDelta: 0,
        fallbackRateDelta: -10,
      },
      traceRates: {
        total: 2,
        success: 1,
        fallback: 1,
        error: 0,
        successRate: 50,
        failureRate: 0,
      },
      recent: [{ id: "ai_1", timestamp: new Date().toISOString(), level: "warn", scope: "ai.summary", message: "Fallback summary used." }],
    },
    aiSummaryEvaluations: {
      status: "warning",
      totals: { total: 2, healthy: 1, warning: 1, critical: 0 },
      latestAt: new Date().toISOString(),
      averageScore: 80,
      latestScore: 60,
      recent: [{ id: "eval_1", timestamp: new Date().toISOString(), level: "warn", scope: "ai.summary.eval", message: "AI summary evaluation warning." }],
    },
    aiSummaryBudget: {
      day: "2026-04-08",
      usageUsd: 0.12,
      runs: 6,
      updatedAt: new Date().toISOString(),
      dailyBudgetUsd: 1,
      estimatedCostPerRunUsd: 0.02,
      projectedUsageUsd: 0.14,
      remainingUsd: 0.88,
      budgetExceeded: false,
      recent: [],
    },
    legacyCompatibility: {
      total: 1,
      updatedAt: new Date().toISOString(),
      byAction: { help: 1 },
      bySurface: { terminal: 1 },
      recent: [{ id: "legacy_1", timestamp: new Date().toISOString(), surface: "terminal", action: "help" }],
    },
  })),
}));

import { GET, PATCH } from "@/app/api/admin/access/route";
import { getSessionUser } from "@/src/lib/auth";
import {
  createAdminWorkspaceInvite,
  listAdminAccessPayload,
  listAdminIncidentApprovals,
  moveUserToWorkspace,
  renameWorkspace,
  runAdminAiSummaryCheck,
} from "@/src/server/services/admin-service";
import { saveControlCenterGovernance, saveControlCenterWorkspacePolicy } from "@/src/server/services/control-center-service";

describe("admin access route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns users, workspaces, and invites for admins", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "admin_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(listAdminAccessPayload).mockResolvedValue({
      users: [],
      workspaces: [],
      invites: [],
    });
    vi.mocked(listAdminIncidentApprovals).mockResolvedValue([
      {
        id: "approval_1",
        label: "Approve",
        requestedByName: "Admin",
        status: "pending",
        createdAt: new Date().toISOString(),
        workspaceId: "workspace_1",
        workspaceName: "Pulse Workspace",
      },
    ] as never);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(listAdminAccessPayload).toHaveBeenCalled();
    expect(payload.data.governance.currentEnvironment).toBe("staging");
    expect(payload.data.approvals).toHaveLength(1);
    expect(payload.data.audit).toHaveLength(1);
    expect(payload.data.diagnostics.summary.total).toBe(1);
    expect(payload.data.runtime.aiSummary.providerMode).toBeDefined();
    expect(payload.data.runtime.aiSummary.dailyBudgetUsd).toBeDefined();
    expect(payload.data.runtime.jobs.executionMode).toBeDefined();
    expect(payload.data.runtime.jobs.maxPendingJobs).toBeDefined();
    expect(payload.data.runtime.jobs.externalWorkerRecommended).toBeDefined();
    expect(payload.data.runtime.process.memory.rssMb).toBeDefined();
    expect(typeof payload.data.runtime.aiSummary.timeoutMs).toBe("number");
    expect(payload.data.runtime.jobs.health.saturated).toBeDefined();
    expect(payload.data.aiSummaryReliability.status).toBe("warning");
    expect(payload.data.aiSummaryReliability.traceRates.total).toBe(2);
    expect(payload.data.aiSummaryEvaluations.averageScore).toBe(80);
    expect(payload.data.aiSummaryBudget.runs).toBe(6);
    expect(payload.data.legacyCompatibility.total).toBe(1);
  });

  it("creates workspace invites through the admin patch route", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "admin_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(createAdminWorkspaceInvite).mockResolvedValue({
      id: "invite_1",
      token: "invite-token",
      email: "person@example.com",
      workspaceId: "workspace_2",
      workspaceName: "Northstar",
      createdAt: new Date().toISOString(),
      createdByEmail: "admin@example.com",
      status: "pending",
    });

    const request = new Request("http://localhost/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "workspace-invite",
        workspaceId: "workspace_2",
        email: "person@example.com",
      }),
    });

    const response = await PATCH(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(createAdminWorkspaceInvite).toHaveBeenCalledWith({
      workspaceId: "workspace_2",
      email: "person@example.com",
      createdById: "admin_1",
    });
  });

  it("moves users between workspaces", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "admin_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(moveUserToWorkspace).mockResolvedValue({
      id: "workspace_2",
      name: "Northstar",
    } as never);

    const request = new Request("http://localhost/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "user-workspace",
        userId: "user_2",
        workspaceId: "workspace_2",
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    expect(moveUserToWorkspace).toHaveBeenCalledWith("user_2", "workspace_2");
  });

  it("renames workspaces", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "admin_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(renameWorkspace).mockResolvedValue({
      id: "workspace_2",
      name: "Northstar",
    } as never);

    const request = new Request("http://localhost/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "workspace-rename",
        workspaceId: "workspace_2",
        workspaceName: "Northstar",
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    expect(renameWorkspace).toHaveBeenCalledWith("workspace_2", "Northstar");
  });

  it("restores governance updates for the platform UI", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "admin_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });

    const request = new Request("http://localhost/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "governance",
        governance: { currentEnvironment: "production" },
      }),
    });

    const response = await PATCH(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(saveControlCenterGovernance).toHaveBeenCalledWith({ currentEnvironment: "production" });
  });

  it("restores workspace policy override updates for the platform UI", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "admin_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });

    const request = new Request("http://localhost/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "workspace-policy",
        workspaceId: "workspace_2",
        policyOverride: { trustDropAction: "notify" },
      }),
    });

    const response = await PATCH(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(saveControlCenterWorkspacePolicy).toHaveBeenCalledWith(
      "workspace_2",
      { trustDropAction: "notify" },
      undefined,
      expect.objectContaining({ id: "admin_1", email: "admin@example.com" }),
    );
  });

  it("runs an admin AI summary check", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "admin_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(runAdminAiSummaryCheck).mockResolvedValue({
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
      title: "Pulse Workspace briefing summary",
      summary: "Top priority items are ready for operator review.",
      bullets: ["A report is ready to publish.", "Editorial review is waiting."],
      provider: "mock",
      model: "rule-based-fallback",
      promptVersion: "2026-04-06.v1",
      attempts: 0,
      latencyMs: 3,
      fallbackReason: "provider_mode_mock",
      traceId: "ai_trace_123",
      viewName: "Admin AI summary check",
      forcedFallback: false,
    });

    const request = new Request("http://localhost/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "ai-summary-check",
      }),
    });

    const response = await PATCH(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.summaryCheck.traceId).toBe("ai_trace_123");
    expect(runAdminAiSummaryCheck).toHaveBeenCalledWith({
      workspaceId: "workspace_1",
      requestedById: "admin_1",
      forceFallback: undefined,
    });
  });

  it("runs an admin AI fallback drill", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "admin_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(runAdminAiSummaryCheck).mockResolvedValue({
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
      title: "Pulse Workspace briefing summary",
      summary: "Forced fallback drill completed.",
      bullets: ["Fallback path exercised."],
      provider: "mock",
      model: "rule-based-fallback",
      promptVersion: "2026-04-06.v1",
      attempts: 0,
      latencyMs: 2,
      fallbackReason: "operator_fallback_drill",
      traceId: "ai_trace_drill",
      viewName: "Admin AI summary check",
      forcedFallback: true,
    });

    const request = new Request("http://localhost/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "ai-summary-check",
        forceFallback: true,
      }),
    });

    const response = await PATCH(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.summaryCheck.forcedFallback).toBe(true);
    expect(runAdminAiSummaryCheck).toHaveBeenCalledWith({
      workspaceId: "workspace_1",
      requestedById: "admin_1",
      forceFallback: true,
    });
  });
});
