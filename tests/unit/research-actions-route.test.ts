import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/services/governed-research-action-service", () => ({
  executeGovernedResearchAction: vi.fn(),
}));

import { POST } from "@/app/api/research/actions/route";
import { getSessionUser } from "@/src/lib/auth";
import { executeGovernedResearchAction } from "@/src/server/services/governed-research-action-service";

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
    vi.mocked(executeGovernedResearchAction).mockResolvedValue({
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
    expect(executeGovernedResearchAction).toHaveBeenCalledWith(
      {
        action: "brief:route",
        payload: { briefId: "brief_1" },
      },
      expect.objectContaining({ id: "user_1", workspaceId: "workspace_1" }),
    );
  });

  it("preserves explicit confirmation for governed retries", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "analyst@example.com",
      name: "Analyst",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(executeGovernedResearchAction).mockResolvedValue({
      action: "report:publish",
      output: "Published report.",
    });

    const response = await POST(
      new Request("http://localhost/api/research/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report:publish", payload: { reportId: "report_1" }, confirmed: true }),
      }),
    );

    expect(response.status).toBe(200);
    expect(executeGovernedResearchAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "report:publish", confirmed: true }),
      expect.objectContaining({ id: "user_1" }),
    );
  });
});
