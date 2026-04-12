import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/services/workspace-service", () => ({
  getWorkspaceSettingsSnapshot: vi.fn(),
  updateWorkspaceSettings: vi.fn(),
}));

import { GET, PATCH } from "@/app/api/settings/workspace/route";
import { getSessionUser } from "@/src/lib/auth";
import { getWorkspaceSettingsSnapshot, updateWorkspaceSettings } from "@/src/server/services/workspace-service";

describe("settings workspace route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns settings snapshot for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "owner@example.com",
      name: "Owner",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(getWorkspaceSettingsSnapshot).mockResolvedValue({
      workspace: {
        id: "workspace_1",
        name: "Pulse Workspace",
        slug: "pulse-workspace",
        description: "Workspace",
        plan: "pro",
      },
      membershipRole: "owner",
      members: [],
      invites: [],
    } as never);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(getWorkspaceSettingsSnapshot).toHaveBeenCalledWith("user_1", "workspace_1");
  });

  it("rejects anonymous settings reads", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });

  it("updates workspace settings for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "owner@example.com",
      name: "Owner",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(updateWorkspaceSettings).mockResolvedValue({
      workspace: {
        id: "workspace_1",
        name: "Renamed Workspace",
        slug: "pulse-workspace",
        description: "Workspace",
        plan: "pro",
      },
      membershipRole: "owner",
      members: [],
      invites: [],
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/settings/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceName: "Renamed Workspace",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(updateWorkspaceSettings).toHaveBeenCalledWith({
      userId: "user_1",
      userRole: "admin",
      workspaceId: "workspace_1",
      workspaceName: "Renamed Workspace",
    });
  });
});
