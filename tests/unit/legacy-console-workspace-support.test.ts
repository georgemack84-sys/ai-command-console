import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  listWorkspaceRoutes,
  listWorkspaceUsers,
  getWorkspaceName,
  listAllWorkspaceIds,
  computeDigestSchedulerStaleState,
  createBriefRecord,
  createReportRecord,
  queueBriefToTask,
  publishReportRecord,
} = require("../../services/legacyConsoleWorkspaceSupport.js");

describe("legacy console workspace support", () => {
  it("reads workspace routes, users, names, and ids from workspace documents", () => {
    const loadWorkspaceDocument = vi.fn((key: string) => {
      if (key === "workspace.routes") {
        return {
          alpha: [{ id: "route_1" }],
          beta: [{ id: "route_2" }],
        };
      }

      if (key === "workspace.users") {
        return [
          { id: "user_1", workspaceId: "alpha", workspaceName: "Alpha" },
          { id: "user_2", workspaceId: "alpha", workspaceName: "Alpha", status: "disabled" },
          { id: "user_3", workspaceId: "beta", workspaceName: "Beta" },
        ];
      }

      return null;
    });

    expect(listWorkspaceRoutes(loadWorkspaceDocument, "routes.json", "alpha")).toEqual([{ id: "route_1" }]);
    expect(listWorkspaceUsers(loadWorkspaceDocument, "users.json", "alpha")).toEqual([
      { id: "user_1", workspaceId: "alpha", workspaceName: "Alpha" },
    ]);
    expect(getWorkspaceName(loadWorkspaceDocument, "users.json", "alpha")).toBe("Alpha");
    expect(
      listAllWorkspaceIds(loadWorkspaceDocument, "users.json", {
        digestWorkspaceState: { gamma: {} },
      }),
    ).toEqual(expect.arrayContaining(["alpha", "beta", "gamma"]));
  });

  it("computes digest scheduler stale state", () => {
    const stale = computeDigestSchedulerStaleState({
      enabled: true,
      intervalMs: 60_000,
      lastRunAt: null,
    });
    expect(stale.stale).toBe(true);
    expect(stale.staleAfterMs).toBeGreaterThan(0);

    expect(
      computeDigestSchedulerStaleState({
        enabled: false,
        intervalMs: 60_000,
        lastRunAt: null,
      }),
    ).toEqual({
      stale: false,
      staleAfterMs: 0,
      ageMs: 0,
    });
  });

  it("creates briefs and reports, queues briefs, and publishes reports", () => {
    let briefs = [
      {
        id: "brief_1",
        title: "Ops recap",
        question: "What changed?",
        status: "draft",
        priority: "high",
        assignedAgent: "researcher",
        tags: ["ops"],
      },
    ];
    let reports = [
      {
        id: "report_1",
        briefId: "brief_1",
        title: "Ops report",
        status: "draft",
      },
    ];

    const listBriefs = vi.fn(() => briefs);
    const saveBriefs = vi.fn((_workspace: string, nextBriefs: typeof briefs) => {
      briefs = nextBriefs;
    });
    const listReports = vi.fn(() => reports);
    const saveReports = vi.fn((_workspace: string, nextReports: typeof reports) => {
      reports = nextReports;
    });
    const addTask = vi.fn(() => ({ id: "task_1" }));

    const createdBrief = createBriefRecord(listBriefs, saveBriefs, "alpha", {
      id: "brief_2",
      title: "Market watch",
      question: "What happened?",
      assignedAgent: "analyst",
      tags: ["market"],
    });
    expect(createdBrief.id).toBe("brief_2");
    expect(briefs[0].id).toBe("brief_2");

    const createdReport = createReportRecord(listReports, saveReports, "alpha", {
      id: "report_2",
      briefId: "brief_2",
      title: "Market report",
      keyFindings: ["signal"],
    });
    expect(createdReport.id).toBe("report_2");
    expect(reports[0].id).toBe("report_2");

    const queued = queueBriefToTask(listBriefs, saveBriefs, addTask, "alpha", "brief_1");
    expect(queued.ok).toBe(true);
    expect(addTask).toHaveBeenCalledWith(
      "researcher",
      "Ops recap: What changed?",
      expect.objectContaining({
        priority: 1,
        tags: ["research-brief", "ops"],
      }),
    );
    expect(briefs.find((brief) => brief.id === "brief_1")).toEqual(
      expect.objectContaining({
        status: "queued",
        linkedTaskId: "task_1",
      }),
    );

    const published = publishReportRecord(listReports, saveReports, listBriefs, saveBriefs, "alpha", "report_1");
    expect(published.ok).toBe(true);
    expect(reports.find((report) => report.id === "report_1")).toEqual(
      expect.objectContaining({
        status: "published",
      }),
    );
    expect(briefs.find((brief) => brief.id === "brief_1")).toEqual(
      expect.objectContaining({
        status: "complete",
        summary: 'Published report "Ops report" completed this brief.',
      }),
    );
  });
});
