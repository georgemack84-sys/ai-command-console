import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/services/workspace-service", () => ({
  getWorkspaceSnapshot: vi.fn(),
}));

import { GET } from "@/app/api/workspace/route";
import { getSessionUser } from "@/src/lib/auth";
import { getWorkspaceSnapshot } from "@/src/server/services/workspace-service";

describe("workspace route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns workspace data for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "owner@example.com",
      name: "Owner",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(getWorkspaceSnapshot).mockResolvedValue({
      workspace: {
        id: "workspace_1",
        name: "Pulse Workspace",
        description: "Workspace",
        memberCount: 3,
      },
      sources: [],
      updates: [],
      insights: [],
      activity: [],
    } as never);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(getWorkspaceSnapshot).toHaveBeenCalledWith("workspace_1");
  });

  it("returns unauthorized for anonymous users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });
});
