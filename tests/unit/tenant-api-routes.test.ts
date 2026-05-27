import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/auth/permissions", () => ({
  requireWorkspaceMember: vi.fn(),
}));

vi.mock("@/services/sam/samBridgeController", () => ({
  runSamBridge: vi.fn(),
}));

vi.mock("@/services/recovery/recoveryReadModel", () => ({
  buildRecoveryReadModel: vi.fn(),
}));

vi.mock("@/controllers/recoveryOperatorController", () => ({
  getRecoveryOperatorView: vi.fn(),
}));

vi.mock("@/services/observability/metricSnapshot", () => ({
  buildMetricSnapshot: vi.fn(),
}));

vi.mock("@/services/observability/systemHealth", () => ({
  buildSystemHealthSnapshot: vi.fn(),
}));

vi.mock("@/services/observability/alertEvaluator", () => ({
  evaluateCurrentAlerts: vi.fn(),
}));

import { getSessionUser } from "@/src/lib/auth";
import { runSamBridge } from "@/services/sam/samBridgeController";
import { buildRecoveryReadModel } from "@/services/recovery/recoveryReadModel";
import { getRecoveryOperatorView } from "@/controllers/recoveryOperatorController";
import { buildMetricSnapshot } from "@/services/observability/metricSnapshot";
import { buildSystemHealthSnapshot } from "@/services/observability/systemHealth";
import { evaluateCurrentAlerts } from "@/services/observability/alertEvaluator";
import { POST as SamProposalPOST } from "@/app/api/v1/sam/proposal/route";
import { GET as ExecutionStatusGET } from "@/app/api/v1/execution/status/route";
import { POST as RecoveryRunPOST } from "@/app/api/v1/recovery/run/route";
import { GET as ObservabilityHealthGET } from "@/app/api/v1/observability/health/route";

describe("tenant api routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Workspace 1",
    } as never);

    vi.mocked(runSamBridge).mockResolvedValue({
      ok: true,
      mode: "bridge",
      proposalId: "proposal_1",
      executionId: "exec_1",
      stage: "completed",
      blocked: false,
      preflight: { allowed: true, blocked: false, checks: { readModelAvailable: true, operatorActionAllowed: true, evidenceValid: true, disputedState: false }, source: {} },
      approval: { required: true, granted: true, denied: false, status: "granted" },
      dryRun: { dryRun: true, executed: false, wouldExecute: true, actionType: "recover_execution", summary: "ok", expectedEffects: [], blockedEffects: [] },
      audit: { attempted: true, appended: true, auditId: "audit-1" },
      errors: [],
    } as never);
    vi.mocked(buildRecoveryReadModel).mockResolvedValue({
      ok: true,
      data: {
        executionId: "exec_1",
        execution: { status: "running" },
        risk: { requiresOperatorAttention: false },
      },
    } as never);
    vi.mocked(getRecoveryOperatorView).mockResolvedValue({
      ok: true,
      data: { timelineMatchesReadModel: true },
    } as never);
    vi.mocked(buildMetricSnapshot).mockResolvedValue({
      snapshotId: "snap-1",
      generatedAt: "2026-05-07T00:00:00.000Z",
      healthStatus: "HEALTHY",
      metrics: [],
      sources: [],
      degradedSignals: [],
      unknownSignals: [],
    } as never);
    vi.mocked(buildSystemHealthSnapshot).mockReturnValue({
      status: "HEALTHY",
      generatedAt: "2026-05-07T00:00:00.000Z",
      components: [],
      summary: "ok",
      recommendedAction: "none",
    } as never);
    vi.mocked(evaluateCurrentAlerts).mockResolvedValue([] as never);
  });

  it("rejects missing tenant context when session workspace is missing", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "",
      workspaceName: "",
    } as never);

    const response = await ExecutionStatusGET(new Request("http://localhost/api/v1/execution/status?executionId=exec_1"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
  });

  it("rejects spoofed tenant headers", async () => {
    const response = await ObservabilityHealthGET(
      new Request("http://localhost/api/v1/observability/health", {
        headers: {
          "x-tenant-id": "tenant-other",
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.ok).toBe(false);
  });

  it("preserves response shape for tenant-scoped routes", async () => {
    const samResponse = await SamProposalPOST(new Request("http://localhost/api/v1/sam/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposal: {
          proposalId: "proposal_1",
          executionId: "exec_1",
          attemptId: "attempt_1",
          actionType: "recover_execution",
          requestedBy: "ai",
          reason: "preview",
          riskLevel: "high",
          confidence: 0.8,
          params: {},
          createdAt: "2026-05-07T00:00:00.000Z",
        },
        approval: { status: "granted" },
      }),
    }));
    const samPayload = await samResponse.json();

    expect(samPayload.ok).toBe(true);
    expect(samPayload.data).toBeDefined();

    const recoveryResponse = await RecoveryRunPOST(new Request("http://localhost/api/v1/recovery/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ executionId: "exec_1" }),
    }));
    const recoveryPayload = await recoveryResponse.json();
    expect(recoveryPayload.ok).toBe(true);
  });
});
