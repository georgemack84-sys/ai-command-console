import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/services/research-action-service", () => ({
  executeResearchAction: vi.fn(),
}));

import { POST } from "@/app/api/research/actions/route";
import { getSessionUser } from "@/src/lib/auth";
import { executeResearchAction } from "@/src/server/services/research-action-service";

describe("research actions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes research actions for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "analyst@example.com",
      name: "Analyst",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(executeResearchAction).mockResolvedValue({
      action: "brief:route",
      output: "Queued brief.",
    });

    const response = await POST(
      new Request("http://localhost/api/research/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "brief:route", payload: { briefId: "brief_1" } }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(executeResearchAction).toHaveBeenCalled();
  });
});
