import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/db/prisma", () => ({
  prisma: {
    researchBrief: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    researchReport: {
      findFirst: vi.fn(),
    },
    activityEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/src/server/services/research-service", () => ({
  createReport: vi.fn(),
  updateReport: vi.fn(),
}));

import { prisma } from "@/src/server/db/prisma";
import { createReport, updateReport } from "@/src/server/services/research-service";
import { executeResearchAction } from "@/src/server/services/research-action-service";

const actor = {
  id: "user_1",
  email: "analyst@example.com",
  name: "Analyst",
  role: "admin" as const,
  workspaceId: "workspace_1",
};

describe("research action service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes a brief through Prisma instead of the legacy console", async () => {
    vi.mocked(prisma.researchBrief.findFirst).mockResolvedValue({
      id: "brief_1",
      title: "Threat brief",
      assignedAgent: "researcher",
      linkedTaskId: null,
      workspaceId: "workspace_1",
      ownerId: "user_1",
    } as never);
    vi.mocked(prisma.researchBrief.update).mockResolvedValue({ id: "brief_1" } as never);
    vi.mocked(prisma.activityEvent.create).mockResolvedValue({ id: "activity_1" } as never);

    const result = await executeResearchAction({ action: "brief:route", payload: { briefId: "brief_1" } }, actor);

    expect(result.output).toContain("Queued brief");
    expect(prisma.researchBrief.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "brief_1" },
        data: expect.objectContaining({ status: "queued" }),
      }),
    );
  });

  it("creates a report through the Prisma-backed research service flow", async () => {
    vi.mocked(prisma.researchBrief.findFirst).mockResolvedValue({
      id: "brief_1",
      title: "Threat brief",
      workspaceId: "workspace_1",
      ownerId: "user_1",
    } as never);
    vi.mocked(createReport).mockResolvedValue({
      id: "report_1",
      title: "Threat brief memo",
      format: "memo",
      keyFindings: ["Finding"],
    } as never);
    vi.mocked(prisma.activityEvent.create).mockResolvedValue({ id: "activity_2" } as never);

    const result = await executeResearchAction(
      {
        action: "report:create",
        payload: {
          briefId: "brief_1",
          title: "Threat brief memo",
          format: "memo",
          excerpt: "Draft excerpt",
          keyFindings: ["Finding"],
        },
      },
      actor,
    );

    expect(result.output).toContain("Created draft report");
    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace_1",
        briefId: "brief_1",
      }),
    );
  });

  it("publishes a report without using the legacy console", async () => {
    vi.mocked(prisma.researchReport.findFirst).mockResolvedValue({
      id: "report_1",
      title: "Threat brief memo",
      briefId: "brief_1",
      workspaceId: "workspace_1",
    } as never);
    vi.mocked(updateReport).mockResolvedValue({ id: "report_1" } as never);
    vi.mocked(prisma.activityEvent.create).mockResolvedValue({ id: "activity_3" } as never);

    const result = await executeResearchAction(
      { action: "report:publish", payload: { reportId: "report_1" } },
      actor,
    );

    expect(result.output).toContain("Published report");
    expect(updateReport).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace_1",
        reportId: "report_1",
        patch: { status: "published" },
      }),
    );
  });
});
