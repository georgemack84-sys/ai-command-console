import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/services/admin-service", () => ({
  createAdminWorkspaceInvite: vi.fn(),
  moveUserToWorkspace: vi.fn(),
  renameWorkspace: vi.fn(),
  revokeAdminWorkspaceInvite: vi.fn(),
  runAdminAiSummaryCheck: vi.fn(),
  updateUserRole: vi.fn(),
  updateUserStatus: vi.fn(),
}));

vi.mock("@/src/server/services/control-center-service", () => ({
  saveControlCenterGovernance: vi.fn(),
  saveControlCenterWorkspacePolicy: vi.fn(),
}));

import {
  createAdminWorkspaceInvite,
  runAdminAiSummaryCheck,
} from "@/src/server/services/admin-service";
import { saveControlCenterWorkspacePolicy } from "@/src/server/services/control-center-service";
import { executeAdminAccessAction } from "@/src/server/services/admin-access-action-service";

const admin = {
  id: "admin_1",
  workspaceId: "workspace_1",
  name: "Admin",
  email: "admin@example.com",
  role: "admin" as const,
};

describe("admin access action service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-admin actors before dispatch", async () => {
    await expect(
      executeAdminAccessAction(
        { type: "user-status", userId: "user_1", status: "disabled" },
        { ...admin, role: "operator" },
      ),
    ).rejects.toMatchObject({ status: 403, code: "forbidden" });
  });

  it("preserves the created response status for workspace invites", async () => {
    vi.mocked(createAdminWorkspaceInvite).mockResolvedValue({ id: "invite_1" } as never);

    const result = await executeAdminAccessAction(
      { type: "workspace-invite", workspaceId: "workspace_2", email: "member@example.com" },
      admin,
    );

    expect(createAdminWorkspaceInvite).toHaveBeenCalledWith({
      workspaceId: "workspace_2",
      email: "member@example.com",
      createdById: "admin_1",
    });
    expect(result).toEqual({ data: { invite: { id: "invite_1" } }, status: 201 });
  });

  it("passes the authenticated actor into workspace policy changes", async () => {
    vi.mocked(saveControlCenterWorkspacePolicy).mockResolvedValue({ currentEnvironment: "staging" } as never);

    await executeAdminAccessAction(
      { type: "workspace-policy", workspaceId: "workspace_2", policyOverride: { trustDropAction: "block" } },
      admin,
    );

    expect(saveControlCenterWorkspacePolicy).toHaveBeenCalledWith(
      "workspace_2",
      { trustDropAction: "block" },
      undefined,
      admin,
    );
  });

  it("defaults AI summary checks to the actor workspace", async () => {
    vi.mocked(runAdminAiSummaryCheck).mockResolvedValue({ status: "healthy" } as never);

    await executeAdminAccessAction({ type: "ai-summary-check", forceFallback: true }, admin);

    expect(runAdminAiSummaryCheck).toHaveBeenCalledWith({
      workspaceId: "workspace_1",
      requestedById: "admin_1",
      forceFallback: true,
    });
  });
});
