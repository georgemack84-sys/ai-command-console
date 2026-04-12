import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/services/dashboard-action-service", () => ({
  executeDashboardAction: vi.fn(),
}));

import { POST } from "@/app/api/dashboard/actions/route";
import { getSessionUser } from "@/src/lib/auth";
import { executeDashboardAction } from "@/src/server/services/dashboard-action-service";

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
    vi.mocked(executeDashboardAction).mockResolvedValue({
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
    expect(executeDashboardAction).toHaveBeenCalled();
  });
});
