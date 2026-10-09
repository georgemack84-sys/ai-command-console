import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/src/server/auth/permissions", () => ({
  requireWorkspaceMember: vi.fn(),
  requireWorkspaceViewer: vi.fn(),
}));
vi.mock("@/src/server/services/governed-research-brief-mutation-service", () => ({
  executeGovernedResearchBriefMutation: vi.fn(),
}));
vi.mock("@/src/server/services/research-service", () => ({ listBriefs: vi.fn() }));

import { DELETE, GET, PATCH, POST } from "@/app/api/research/briefs/route";
import { getSessionUser } from "@/src/lib/auth";
import { executeGovernedResearchBriefMutation } from "@/src/server/services/governed-research-brief-mutation-service";
import { listBriefs } from "@/src/server/services/research-service";

const user = {
  id: "user_1",
  email: "analyst@example.com",
  name: "Analyst",
  role: "operator",
  status: "active",
  workspaceId: "workspace_1",
  workspaceName: "Workspace",
};

describe("research briefs route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue(user);
    vi.mocked(listBriefs).mockResolvedValue([]);
  });

  it("keeps brief reads outside mutation governance", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(listBriefs).toHaveBeenCalledWith(user.workspaceId);
    expect(executeGovernedResearchBriefMutation).not.toHaveBeenCalled();
  });

  it.each([
    [POST, "POST", "create", { title: "Brief", question: "What changed?" }],
    [PATCH, "PATCH", "update", { id: "brief_1", status: "in_review" }],
    [PATCH, "PATCH", "route", { id: "brief_1", routeToQueue: true }],
    [DELETE, "DELETE", "delete", { briefId: "brief_1" }],
  ] as const)("governs %s mutations", async (handler, method, action, body) => {
    vi.mocked(executeGovernedResearchBriefMutation).mockResolvedValue({ data: { briefs: [] } } as never);
    const response = await handler(new Request("http://localhost/api/research/briefs", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, confirmed: true }),
    }));

    expect(response.status).toBe(200);
    expect(executeGovernedResearchBriefMutation).toHaveBeenCalledWith(
      { action, payload: expect.objectContaining(body), confirmed: true },
      user,
    );
  });

  it("returns confirmation evidence without mutating", async () => {
    vi.mocked(executeGovernedResearchBriefMutation).mockResolvedValue({
      action: "delete",
      output: "Confirmation required.",
      requiresConfirmation: true,
    } as never);
    const response = await DELETE(new Request("http://localhost/api/research/briefs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ briefId: "brief_1" }),
    }));
    const payload = await response.json();

    expect(payload.data.requiresConfirmation).toBe(true);
  });
});
