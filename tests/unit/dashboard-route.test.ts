import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/services/dashboard-service", () => ({
  buildDashboardSnapshot: vi.fn(),
}));

import { GET } from "@/app/api/dashboard/route";
import { getSessionUser } from "@/src/lib/auth";
import { buildDashboardSnapshot } from "@/src/server/services/dashboard-service";

describe("dashboard route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns dashboard data for an authenticated workspace user", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });

    vi.mocked(buildDashboardSnapshot).mockResolvedValue({
      generatedAt: new Date().toISOString(),
      summaryCards: [],
      criticalSignals: [],
      workspaces: [],
      activityFeed: [],
      timelineFeed: [],
      topAlert: null,
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(buildDashboardSnapshot).toHaveBeenCalledWith("workspace_1");
  });

  it("returns an auth error for anonymous users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });
});
