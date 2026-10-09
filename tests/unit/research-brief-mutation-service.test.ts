import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceMember: vi.fn() }));
vi.mock("@/src/server/observability/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/src/server/services/research-action-service", () => ({ executeResearchAction: vi.fn() }));
vi.mock("@/src/server/services/research-service", () => ({
  createBrief: vi.fn(),
  deleteBrief: vi.fn(),
  listBriefs: vi.fn(),
  updateBrief: vi.fn(),
}));

import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { trackEvent } from "@/src/server/observability/analytics";
import { executeResearchAction } from "@/src/server/services/research-action-service";
import { executeResearchBriefMutation } from "@/src/server/services/research-brief-mutation-service";
import { createBrief, deleteBrief, listBriefs, updateBrief } from "@/src/server/services/research-service";

const actor = {
  id: "admin_1",
  workspaceId: "workspace_1",
  name: "Admin",
  email: "admin@example.com",
  role: "admin",
} as const;

describe("research brief mutation service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listBriefs).mockResolvedValue([]);
  });

  it("revalidates workspace authority and creates a normalized brief", async () => {
    vi.mocked(createBrief).mockResolvedValue({ id: "brief_1", priority: "high" } as never);

    const result = await executeResearchBriefMutation({
      action: "create",
      payload: {
        title: " Brief ",
        question: " Question? ",
        status: "draft",
        priority: "high",
        assignedAgent: " researcher ",
        tags: [" urgent ", ""],
        summary: " Summary ",
        queueBrief: true,
      },
    }, actor);

    expect(requireWorkspaceMember).toHaveBeenCalledWith({
      userId: actor.id,
      userRole: actor.role,
      workspaceId: actor.workspaceId,
    });
    expect(createBrief).toHaveBeenCalledWith(expect.objectContaining({
      workspaceId: actor.workspaceId,
      ownerId: actor.id,
      title: "Brief",
      question: "Question?",
      status: "queued",
      assignedAgent: "researcher",
      tags: ["urgent"],
      summary: "Summary",
    }));
    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({ event: "research_brief_created" }));
    expect(result).toEqual(expect.objectContaining({ status: 201, data: { briefs: [], brief: expect.any(Object) } }));
  });

  it("routes a brief through the existing typed research workflow", async () => {
    await executeResearchBriefMutation({ action: "route", payload: { id: "brief_1" } }, actor);

    expect(executeResearchAction).toHaveBeenCalledWith(
      { action: "brief:route", payload: { briefId: "brief_1" } },
      actor,
    );
    expect(updateBrief).not.toHaveBeenCalled();
  });

  it("keeps owner reassignment admin-only", async () => {
    await executeResearchBriefMutation({
      action: "update",
      payload: { id: "brief_1", status: "in_review", ownerId: "user_2" },
    }, { ...actor, role: "operator" });

    expect(updateBrief).toHaveBeenCalledWith(expect.objectContaining({
      briefId: "brief_1",
      patch: { status: "in_review" },
    }));
  });

  it("deletes through the actor-scoped research service", async () => {
    await executeResearchBriefMutation({ action: "delete", payload: { briefId: "brief_1" } }, actor);

    expect(deleteBrief).toHaveBeenCalledWith(actor.workspaceId, "brief_1", actor.id, actor.role);
  });
});
