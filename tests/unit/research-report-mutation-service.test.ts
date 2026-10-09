import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceMember: vi.fn() }));
vi.mock("@/src/server/observability/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/src/server/services/research-service", () => ({
  createReport: vi.fn(),
  deleteReport: vi.fn(),
  listReports: vi.fn(),
  updateReport: vi.fn(),
}));

import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { trackEvent } from "@/src/server/observability/analytics";
import { executeResearchReportMutation } from "@/src/server/services/research-report-mutation-service";
import { createReport, deleteReport, listReports, updateReport } from "@/src/server/services/research-service";

const actor = {
  id: "admin_1",
  workspaceId: "workspace_1",
  name: "Admin",
  email: "admin@example.com",
  role: "admin",
} as const;

describe("research report mutation service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listReports).mockResolvedValue([]);
  });

  it("revalidates workspace authority and creates a normalized report", async () => {
    vi.mocked(createReport).mockResolvedValue({
      id: "report_1",
      briefId: "brief_1",
      title: "Report",
      format: "memo",
    } as never);

    const result = await executeResearchReportMutation({
      action: "create",
      payload: {
        briefId: "brief_1",
        title: " Report ",
        format: "memo",
        status: "draft",
        excerpt: " Draft ",
        keyFindings: [" Finding ", ""],
      },
    }, actor);

    expect(requireWorkspaceMember).toHaveBeenCalledWith({
      userId: actor.id,
      userRole: actor.role,
      workspaceId: actor.workspaceId,
    });
    expect(createReport).toHaveBeenCalledWith(expect.objectContaining({
      workspaceId: actor.workspaceId,
      ownerId: actor.id,
      title: "Report",
      excerpt: "Draft",
      keyFindings: ["Finding"],
    }));
    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({ event: "research_report_created" }));
    expect(result).toEqual(expect.objectContaining({ status: 201, data: { reports: [], report: expect.any(Object) } }));
  });

  it("keeps owner reassignment admin-only while preserving typed updates", async () => {
    await executeResearchReportMutation({
      action: "update",
      payload: { id: "report_1", status: "ready", ownerId: "user_2" },
    }, { ...actor, role: "operator" });

    expect(updateReport).toHaveBeenCalledWith(expect.objectContaining({
      reportId: "report_1",
      patch: { status: "ready" },
    }));
  });

  it("deletes only through the actor-scoped research service", async () => {
    await executeResearchReportMutation({ action: "delete", payload: { reportId: "report_1" } }, actor);

    expect(deleteReport).toHaveBeenCalledWith(actor.workspaceId, "report_1", actor.id, actor.role);
  });
});
