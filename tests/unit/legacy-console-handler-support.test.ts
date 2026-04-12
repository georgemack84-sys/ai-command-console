import { createRequire } from "node:module";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  getResearchWorkspace,
  getActor,
  listWorkspaceRoutesFor,
  listWorkspaceUsersFor,
  getWorkspaceNameFor,
  listAllWorkspaceIdsFor,
  createBriefRecordFor,
  createReportRecordFor,
  queueBriefToTaskFor,
  createReportDraft,
  publishReportRecordFor,
} = require("../../services/legacyConsoleHandlerSupport.js");

describe("legacy console handler support", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T20:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves research workspace and actor defaults", () => {
    expect(getResearchWorkspace({ workspaceId: "alpha" })).toBe("alpha");
    expect(getResearchWorkspace({ userId: "user_1" })).toBe("user_1");
    expect(getResearchWorkspace({})).toBe("demo");

    const actor = getActor(
      { userId: "user_1", userName: "Alex", userRole: "Owner" },
      { normalizeRole: vi.fn(() => "operator") },
    );
    expect(actor).toEqual({ id: "user_1", name: "Alex", role: "operator" });
  });

  it("delegates workspace route and user adapters", () => {
    const deps = {
      listWorkspaceRoutes: vi.fn(() => [{ path: "/dashboard" }]),
      listWorkspaceUsers: vi.fn(() => [{ id: "user_1" }]),
      getWorkspaceName: vi.fn(() => "Alpha"),
      listAllWorkspaceIds: vi.fn(() => ["alpha", "beta"]),
      loadWorkspaceDocument: vi.fn(),
      loadCollaborationState: vi.fn(() => ({ digestWorkspaceState: {} })),
      routesPath: "routes.json",
      usersPath: "users.json",
    };

    expect(listWorkspaceRoutesFor("alpha", deps)).toEqual([{ path: "/dashboard" }]);
    expect(listWorkspaceUsersFor("alpha", deps)).toEqual([{ id: "user_1" }]);
    expect(getWorkspaceNameFor("alpha", deps)).toBe("Alpha");
    expect(listAllWorkspaceIdsFor(deps)).toEqual(["alpha", "beta"]);
  });

  it("delegates brief and report helpers", () => {
    const deps = {
      createBriefRecord: vi.fn(() => ({ id: "brief_1" })),
      createReportRecord: vi.fn(() => ({ id: "report_1", briefId: "brief_1", title: "Report" })),
      queueBriefToTask: vi.fn(() => ({ ok: true, task: { id: "task_1" } })),
      publishReportRecord: vi.fn(() => ({ ok: true, report: { id: "report_1" } })),
      listBriefs: vi.fn(() => [{ id: "brief_1", status: "draft" }]),
      saveBriefs: vi.fn(),
      listReports: vi.fn(),
      saveReports: vi.fn(),
      addTask: vi.fn(),
    };

    expect(createBriefRecordFor("alpha", { title: "Brief" }, deps)).toEqual({ id: "brief_1" });
    expect(createReportRecordFor("alpha", { title: "Report" }, deps)).toEqual({ id: "report_1", briefId: "brief_1", title: "Report" });
    expect(queueBriefToTaskFor("alpha", "brief_1", deps)).toEqual({ ok: true, task: { id: "task_1" } });
    expect(publishReportRecordFor("alpha", "report_1", deps)).toEqual({ ok: true, report: { id: "report_1" } });

    const draft = createReportDraft("alpha", { briefId: "brief_1", title: "Report" }, deps);
    expect(draft).toEqual({ id: "report_1", briefId: "brief_1", title: "Report" });
    expect(deps.saveBriefs).toHaveBeenCalledWith(
      "alpha",
      [
        expect.objectContaining({
          id: "brief_1",
          status: "in_review",
          summary: 'Report draft "Report" created and waiting for editorial review.',
          updatedAt: "2026-04-10T20:00:00.000Z",
        }),
      ],
    );
  });
});
