import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/auth/permissions", () => ({
  requireWorkspaceMember: vi.fn(),
}));

vi.mock("@/controllers/recoveryOperatorController", () => ({
  getRecoveryOperatorView: vi.fn(),
}));

vi.mock("@/services/sam/samBridgeController", () => ({
  runSamBridge: vi.fn(),
}));

import { getSessionUser } from "@/src/lib/auth";
import { POST as RecoveryRunPOST } from "@/app/api/v1/recovery/run/route";
import { POST as SamProposalPOST } from "@/app/api/v1/sam/proposal/route";

describe("security route enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies recovery previews for viewers", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user-1",
      email: "viewer@example.com",
      name: "Viewer",
      role: "viewer",
      status: "active",
      workspaceId: "workspace-1",
      workspaceName: "Workspace 1",
    } as never);

    const response = await RecoveryRunPOST(new Request("http://localhost/api/v1/recovery/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ executionId: "exec-1" }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.ok).toBe(false);
  });

  it("denies S.A.M. recovery proposals for viewers", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user-1",
      email: "viewer@example.com",
      name: "Viewer",
      role: "viewer",
      status: "active",
      workspaceId: "workspace-1",
      workspaceName: "Workspace 1",
    } as never);

    const response = await SamProposalPOST(new Request("http://localhost/api/v1/sam/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposal: {
          proposalId: "proposal-1",
          executionId: "exec-1",
          attemptId: "attempt-1",
          actionType: "recover_execution",
          requestedBy: "ai",
          reason: "preview",
          riskLevel: "high",
          confidence: 0.9,
          params: {},
          createdAt: "2026-05-07T00:00:00.000Z",
        },
        approval: { status: "granted" },
      }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.ok).toBe(false);
  });
});
