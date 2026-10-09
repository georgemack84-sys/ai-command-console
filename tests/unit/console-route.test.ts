import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/app/api/console/core", () => ({
  getTerminalOverview: vi.fn(),
  executeTerminalRequest: vi.fn(),
}));

vi.mock("@/src/server/auth/permissions", () => ({
  requireWorkspaceMember: vi.fn(),
}));

import { GET, POST } from "@/app/api/console/route";
import { getSessionUser } from "@/src/lib/auth";
import { executeTerminalRequest, getTerminalOverview } from "@/app/api/console/core";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { AppError } from "@/src/server/api/errors";

describe("console route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns terminal overview for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(getTerminalOverview).mockResolvedValue({ dashboard: { title: "Terminal" } } as never);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(getTerminalOverview).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user_1", workspaceId: "workspace_1" }),
    );
  });

  it("executes terminal requests for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(executeTerminalRequest).mockResolvedValue({
      ok: true,
      output: "help output",
      overview: {},
    } as never);

    const response = await POST(
      new Request("http://localhost/api/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "help" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(executeTerminalRequest).toHaveBeenCalledWith(
      { command: "help" },
      expect.objectContaining({ id: "user_1" }),
    );
  });

  it("forwards confirmed console requests for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(executeTerminalRequest).mockResolvedValue({
      ok: true,
      output: "plugin ran",
      overview: {},
    } as never);

    const response = await POST(
      new Request("http://localhost/api/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "run plugin helloPlugin", confirmed: true }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(executeTerminalRequest).toHaveBeenCalledWith(
      { command: "run plugin helloPlugin", confirmed: true },
      expect.objectContaining({ id: "user_1" }),
    );
  });

  it("forwards operator override acknowledgments through the api review surface", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(executeTerminalRequest).mockResolvedValue({
      ok: true,
      output: "override accepted",
      overview: {},
    } as never);

    const response = await POST(
      new Request("http://localhost/api/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "workflow:create-task",
          payload: { agentName: "researcher", description: "Trace signal drift" },
          confirmed: true,
          operatorOverride: { planId: "plan_1", acknowledgment: "BLOCKED_STATE" },
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(executeTerminalRequest).toHaveBeenCalledWith(
      {
        action: "workflow:create-task",
        payload: { agentName: "researcher", description: "Trace signal drift" },
        confirmed: true,
        operatorOverride: { planId: "plan_1", acknowledgment: "BLOCKED_STATE" },
      },
      expect.objectContaining({ id: "user_1" }),
    );
  });

  it("rejects anonymous requests", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });

  it("rejects anonymous console commands with the standard error shape", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "help" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({ code: "unauthorized" }),
      }),
    );
  });

  it("does not execute commands when workspace access is denied", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "operator",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(requireWorkspaceMember).mockRejectedValue(
      new AppError(403, "forbidden", "You do not have access to this workspace."),
    );

    const response = await POST(
      new Request("http://localhost/api/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "help" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("forbidden");
    expect(executeTerminalRequest).not.toHaveBeenCalled();
  });
});
