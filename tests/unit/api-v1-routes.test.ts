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

import { getSessionUser } from "@/src/lib/auth";
import { runSamBridge } from "@/services/sam/samBridgeController";
import { buildRecoveryReadModel } from "@/services/recovery/recoveryReadModel";
import { getRecoveryOperatorView } from "@/controllers/recoveryOperatorController";
import { POST as SamProposalPOST } from "@/app/api/v1/sam/proposal/route";
import { GET as ExecutionStatusGET } from "@/app/api/v1/execution/status/route";
import { GET as MissionStateGET } from "@/app/api/v1/mission/state/route";
import { POST as RecoveryRunPOST } from "@/app/api/v1/recovery/run/route";

describe("api v1 routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    } as never);
  });

  it("validates and executes versioned sam proposal requests", async () => {
    vi.mocked(runSamBridge).mockResolvedValue({
      ok: true,
      mode: "bridge",
      proposalId: "proposal_1",
      executionId: "demo-1",
      attemptId: "attempt-1",
      idempotencyKey: "key-1",
      stage: "completed",
      blocked: false,
      preflight: {
        allowed: true,
        blocked: false,
        checks: {
          readModelAvailable: true,
          operatorActionAllowed: true,
          evidenceValid: true,
          timelineConsistent: true,
          lockValid: true,
          disputedState: false,
        },
        source: {},
      },
      approval: {
        required: true,
        granted: true,
        denied: false,
        status: "granted",
      },
      dryRun: {
        dryRun: true,
        executed: false,
        wouldExecute: true,
        actionType: "recover_execution",
        summary: "would run",
        expectedEffects: [],
        blockedEffects: [],
      },
      audit: {
        attempted: true,
        appended: true,
        auditId: "audit_1",
      },
      errors: [],
    } as never);

    const response = await SamProposalPOST(new Request("http://localhost/api/v1/sam/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposal: {
          proposalId: "proposal_1",
          executionId: "demo-1",
          attemptId: "attempt-1",
          actionType: "recover_execution",
          requestedBy: "ai",
          reason: "preview",
          riskLevel: "high",
          confidence: 0.8,
          params: {},
          createdAt: "2026-05-07T00:00:00.000Z",
        },
        approval: {
          status: "granted",
        },
      }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.result.stage).toBe("completed");
  });

  it("returns versioned execution status", async () => {
    vi.mocked(buildRecoveryReadModel).mockResolvedValue({
      ok: true,
      data: {
        executionId: "demo-1",
        execution: { status: "failed" },
        recovery: { status: "none", attemptsCount: 0 },
        recoveryControl: { status: "none", requiresApproval: false },
        advisory: { status: "none", requiresOperator: false, advisoryOnly: true },
        automation: { status: "none", automationAllowed: false },
        autonomy: { status: "none", autonomyAllowed: false },
        verification: { status: "not_run" },
        learning: { status: "not_run", recommendationCount: 0, hasPolicyRecommendations: false, hasWarnings: false, advisoryOnly: true },
        lock: { isLocked: false, stale: false },
        ledger: { totalEvents: 0 },
        risk: {
          hasFailure: true,
          hasVerificationFailure: false,
          hasStaleLock: false,
          hasOpenAdvisory: false,
          hasUnsafeUnknown: false,
          hasLearningWarnings: false,
          requiresOperatorAttention: true,
        },
        meta: { completeness: "complete", warnings: [] },
      },
    } as never);

    const response = await ExecutionStatusGET(new Request("http://localhost/api/v1/execution/status?executionId=demo-1"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.executionId).toBe("demo-1");
  });

  it("returns versioned mission state", async () => {
    const response = await MissionStateGET(new Request("http://localhost/api/v1/mission/state"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.mode).toBeDefined();
  });

  it("returns versioned dry-run recovery run previews", async () => {
    vi.mocked(getRecoveryOperatorView).mockResolvedValue({
      ok: true,
      data: {
        executionId: "demo-1",
        readModel: { executionId: "demo-1" },
        timeline: { executionId: "demo-1", events: [], meta: { totalEvents: 0, timeRange: {}, completeness: "partial", warnings: [], matchesReadModel: false } },
        timelineMatchesReadModel: false,
        allowedActions: [],
        warnings: [],
      },
    } as never);

    const response = await RecoveryRunPOST(new Request("http://localhost/api/v1/recovery/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        executionId: "demo-1",
      }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.dryRun).toBe(true);
  });
});
