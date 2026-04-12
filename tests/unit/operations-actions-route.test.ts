import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/services/operations-action-service", () => ({
  executeOperationsAction: vi.fn(),
}));

import { POST } from "@/app/api/operations/actions/route";
import { getSessionUser } from "@/src/lib/auth";
import { executeOperationsAction } from "@/src/server/services/operations-action-service";

describe("operations actions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes supported operations actions for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "admin_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(executeOperationsAction).mockResolvedValue({
      action: "collaboration:automation-run-sweep",
      output: "Queued sweep.",
    });

    const response = await POST(
      new Request("http://localhost/api/operations/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "collaboration:automation-run-sweep",
          payload: { workspaceId: "workspace_1" },
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(executeOperationsAction).toHaveBeenCalledWith(
      {
        action: "collaboration:automation-run-sweep",
        payload: { workspaceId: "workspace_1" },
      },
      expect.objectContaining({ id: "admin_1" }),
    );
  });

  it("accepts workspace alias actions at the route boundary", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "admin_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(executeOperationsAction).mockResolvedValue({
      action: "workspace:add-note",
      output: "Added note.",
    });

    const response = await POST(
      new Request("http://localhost/api/operations/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "workspace:add-note",
          payload: { workspaceId: "workspace_1", note: "Alias note." },
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(executeOperationsAction).toHaveBeenCalledWith(
      {
        action: "workspace:add-note",
        payload: { workspaceId: "workspace_1", note: "Alias note." },
      },
      expect.objectContaining({ id: "admin_1" }),
    );
  });

  it("rejects anonymous requests", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/operations/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "collaboration:automation-run-sweep",
          payload: { workspaceId: "workspace_1" },
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });
});
