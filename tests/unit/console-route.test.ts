import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/app/api/console/core", () => ({
  getTerminalOverview: vi.fn(),
  executeTerminalRequest: vi.fn(),
}));

vi.mock("@/services/digestScheduler", () => ({
  ensureDigestScheduler: vi.fn(),
}));

import { GET, POST } from "@/app/api/console/route";
import { getSessionUser } from "@/src/lib/auth";
import { executeTerminalRequest, getTerminalOverview } from "@/app/api/console/core";

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

  it("rejects anonymous requests", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });
});
