import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/services/research-service", () => ({
  createBrief: vi.fn(),
  deleteBrief: vi.fn(),
  listBriefs: vi.fn(),
  updateBrief: vi.fn(),
}));

vi.mock("@/src/server/services/research-action-service", () => ({
  executeResearchAction: vi.fn(),
}));

import { PATCH } from "@/app/api/research/briefs/route";
import { getSessionUser } from "@/src/lib/auth";
import { executeResearchAction } from "@/src/server/services/research-action-service";
import { listBriefs, updateBrief } from "@/src/server/services/research-service";

describe("research briefs route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "admin_1",
      email: "showcase@pulse.local",
      name: "Showcase Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(listBriefs).mockResolvedValue([
      {
        id: "brief_1",
        title: "Threat brief",
        question: "What changed?",
        status: "queued",
        priority: "medium",
        assignedAgent: "researcher",
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: "admin_1",
        summary: "Queued",
        linkedTaskId: "task_123",
      },
    ] as never);
  });

  it("routes list-page brief actions through the research action service", async () => {
    vi.mocked(executeResearchAction).mockResolvedValue({
      action: "brief:route",
      output: 'Queued brief "Threat brief" as task_123.',
    } as never);

    const request = new Request("http://localhost/api/research/briefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "brief_1",
        routeToQueue: true,
      }),
    });

    const response = await PATCH(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(executeResearchAction).toHaveBeenCalledWith(
      {
        action: "brief:route",
        payload: { briefId: "brief_1" },
      },
      expect.objectContaining({
        id: "admin_1",
        workspaceId: "workspace_1",
      }),
    );
    expect(updateBrief).not.toHaveBeenCalled();
  });
});
