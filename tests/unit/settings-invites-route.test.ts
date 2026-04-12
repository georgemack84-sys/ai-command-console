import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/services/workspace-service", () => ({
  createWorkspaceSettingsInvite: vi.fn(),
  revokeWorkspaceSettingsInvite: vi.fn(),
  getWorkspaceSettingsSnapshot: vi.fn(),
}));

import { DELETE, POST } from "@/app/api/settings/invites/route";
import { getSessionUser } from "@/src/lib/auth";
import {
  createWorkspaceSettingsInvite,
  revokeWorkspaceSettingsInvite,
  getWorkspaceSettingsSnapshot,
} from "@/src/server/services/workspace-service";

describe("settings invites route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates invites for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "owner@example.com",
      name: "Owner",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(createWorkspaceSettingsInvite).mockResolvedValue({
      id: "invite_1",
      token: "invite-token",
      email: "person@example.com",
      status: "pending",
      createdAt: new Date().toISOString(),
    } as never);

    const response = await POST(
      new Request("http://localhost/api/settings/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "person@example.com" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(createWorkspaceSettingsInvite).toHaveBeenCalledWith({
      userId: "user_1",
      userRole: "admin",
      workspaceId: "workspace_1",
      email: "person@example.com",
    });
  });

  it("returns an auth error for anonymous invite creation", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/settings/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "person@example.com" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });

  it("revokes invites and returns a fresh snapshot", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "owner@example.com",
      name: "Owner",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(revokeWorkspaceSettingsInvite).mockResolvedValue({
      id: "invite_1",
      token: "invite-token",
      email: "person@example.com",
      status: "revoked",
      createdAt: new Date().toISOString(),
    } as never);
    vi.mocked(getWorkspaceSettingsSnapshot).mockResolvedValue({
      invites: [],
    } as never);

    const response = await DELETE(
      new Request("http://localhost/api/settings/invites?token=invite-token", {
        method: "DELETE",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(revokeWorkspaceSettingsInvite).toHaveBeenCalledWith({
      userId: "user_1",
      userRole: "admin",
      workspaceId: "workspace_1",
      token: "invite-token",
    });
    expect(getWorkspaceSettingsSnapshot).toHaveBeenCalledWith("user_1", "workspace_1");
  });
});
