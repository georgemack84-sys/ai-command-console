import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  createUserAccount: vi.fn(),
  deleteUserAccount: vi.fn(),
  setSessionCookie: vi.fn(),
}));

vi.mock("@/src/server/services/invite-service", () => ({
  readInviteByToken: vi.fn(),
  consumeWorkspaceInvite: vi.fn(),
}));

import { POST } from "@/app/api/auth/signup/route";
import { createUserAccount, deleteUserAccount, setSessionCookie } from "@/src/lib/auth";
import { consumeWorkspaceInvite, readInviteByToken } from "@/src/server/services/invite-service";

describe("signup route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("joins the invited workspace and consumes the invite", async () => {
    vi.mocked(readInviteByToken).mockResolvedValue({
      id: "invite_1",
      token: "invite-token",
      email: "new.user@example.com",
      workspaceId: "workspace_2",
      workspaceName: "Northstar",
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    vi.mocked(createUserAccount).mockResolvedValue({
      user: {
        id: "user_1",
        email: "new.user@example.com",
        name: "New User",
        role: "operator",
        status: "active",
        workspaceId: "workspace_2",
        workspaceName: "Northstar",
      },
    });
    vi.mocked(consumeWorkspaceInvite).mockResolvedValue({
      id: "invite_1",
      token: "invite-token",
      status: "accepted",
    } as never);

    const request = new Request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "new.user@example.com",
        password: "strong-password",
        name: "New User",
        inviteToken: "invite-token",
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(createUserAccount).toHaveBeenCalledWith(
      "new.user@example.com",
      "strong-password",
      "New User",
      { workspaceId: "workspace_2", workspaceName: "Northstar" },
    );
    expect(consumeWorkspaceInvite).toHaveBeenCalledWith("invite-token", "user_1");
    expect(setSessionCookie).toHaveBeenCalled();
  });

  it("rejects invites reserved for another email", async () => {
    vi.mocked(readInviteByToken).mockResolvedValue({
      id: "invite_1",
      token: "invite-token",
      email: "reserved@example.com",
      workspaceId: "workspace_2",
      workspaceName: "Northstar",
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    const request = new Request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "wrong@example.com",
        password: "strong-password",
        name: "Wrong User",
        inviteToken: "invite-token",
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("invite_email_mismatch");
  });

  it("rolls back the account when the invite is revoked before consumption", async () => {
    vi.mocked(readInviteByToken).mockResolvedValue({
      id: "invite_1",
      token: "invite-token",
      email: "new.user@example.com",
      workspaceId: "workspace_2",
      workspaceName: "Northstar",
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    vi.mocked(createUserAccount).mockResolvedValue({
      user: {
        id: "user_1",
        email: "new.user@example.com",
        name: "New User",
        role: "operator",
        status: "active",
        workspaceId: "workspace_2",
        workspaceName: "Northstar",
      },
    });
    vi.mocked(consumeWorkspaceInvite).mockResolvedValue(null);

    const request = new Request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "new.user@example.com",
        password: "strong-password",
        name: "New User",
        inviteToken: "invite-token",
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("invite_no_longer_available");
    expect(deleteUserAccount).toHaveBeenCalledWith("user_1");
  });
});
