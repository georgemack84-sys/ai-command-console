import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/auth/permissions", () => ({
  requireWorkspaceMember: vi.fn(),
}));

vi.mock("@/src/server/services/governed-dashboard-action-service", () => ({
  executeGovernedDashboardAction: vi.fn(),
}));

import { POST } from "@/app/api/dashboard/actions/route";
import { getSessionUser } from "@/src/lib/auth";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { executeGovernedDashboardAction } from "@/src/server/services/governed-dashboard-action-service";

describe("dashboard actions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes dashboard actions for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(executeGovernedDashboardAction).mockResolvedValue({
      action: "alert:run-checks",
      output: "Checks complete.",
    });

    const response = await POST(
      new Request("http://localhost/api/dashboard/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "alert:run-checks", payload: {} }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(requireWorkspaceMember).toHaveBeenCalledWith({
      userId: "user_1",
      userRole: "admin",
      workspaceId: "workspace_1",
    });
    expect(executeGovernedDashboardAction).toHaveBeenCalledWith(
      { action: "alert:run-checks", payload: {} },
      expect.objectContaining({ id: "user_1", workspaceId: "workspace_1" }),
    );
  });

  it("preserves explicit confirmation for governed retries", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(executeGovernedDashboardAction).mockResolvedValue({
      action: "alert:acknowledge",
      output: "Acknowledged alert.",
    });

    const response = await POST(
      new Request("http://localhost/api/dashboard/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "alert:acknowledge",
          payload: { alertId: "alert_1", owner: "dashboard" },
          confirmed: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(executeGovernedDashboardAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "alert:acknowledge", confirmed: true }),
      expect.objectContaining({ id: "user_1" }),
    );
  });
});
