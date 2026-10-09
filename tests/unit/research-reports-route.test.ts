import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/src/server/auth/permissions", () => ({
  requireWorkspaceMember: vi.fn(),
  requireWorkspaceViewer: vi.fn(),
}));
vi.mock("@/src/server/services/governed-research-report-mutation-service", () => ({
  executeGovernedResearchReportMutation: vi.fn(),
}));
vi.mock("@/src/server/services/research-service", () => ({ listReports: vi.fn() }));

import { DELETE, GET, PATCH, POST } from "@/app/api/research/reports/route";
import { getSessionUser } from "@/src/lib/auth";
import { executeGovernedResearchReportMutation } from "@/src/server/services/governed-research-report-mutation-service";
import { listReports } from "@/src/server/services/research-service";

const user = {
  id: "user_1",
  email: "analyst@example.com",
  name: "Analyst",
  role: "operator",
  status: "active",
  workspaceId: "workspace_1",
  workspaceName: "Workspace",
};

describe("research reports route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue(user);
    vi.mocked(listReports).mockResolvedValue([]);
  });

  it("keeps report reads outside mutation governance", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(listReports).toHaveBeenCalledWith(user.workspaceId);
    expect(executeGovernedResearchReportMutation).not.toHaveBeenCalled();
  });

  it.each([
    [POST, "POST", "create", { briefId: "brief_1", title: "Report" }],
    [PATCH, "PATCH", "update", { id: "report_1", status: "ready" }],
    [DELETE, "DELETE", "delete", { reportId: "report_1" }],
  ] as const)("governs %s mutations", async (handler, method, action, body) => {
    vi.mocked(executeGovernedResearchReportMutation).mockResolvedValue({ data: { reports: [] } } as never);
    const response = await handler(new Request("http://localhost/api/research/reports", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, confirmed: true }),
    }));

    expect(response.status).toBe(200);
    expect(executeGovernedResearchReportMutation).toHaveBeenCalledWith(
      { action, payload: expect.objectContaining(body), confirmed: true },
      user,
    );
  });

  it("returns confirmation evidence without mutating", async () => {
    vi.mocked(executeGovernedResearchReportMutation).mockResolvedValue({
      action: "delete",
      output: "Confirmation required.",
      requiresConfirmation: true,
    } as never);
    const response = await DELETE(new Request("http://localhost/api/research/reports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: "report_1" }),
    }));
    const payload = await response.json();

    expect(payload.data.requiresConfirmation).toBe(true);
  });
});
