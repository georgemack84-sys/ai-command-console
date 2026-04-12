import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  safeCount,
  safeValue,
  formatEventTitle,
  buildWorkspaceInventorySnapshot,
} = require("../../services/dashboardSupport.js");

describe("dashboard support helpers", () => {
  it("formats event titles and catches safe fallbacks", () => {
    expect(formatEventTitle("review:approve-item")).toBe("Review Approve Item");
    expect(safeCount(() => 4)).toBe(4);
    expect(safeCount(() => {
      throw new Error("boom");
    }, 7)).toBe(7);
    expect(safeValue(() => {
      throw new Error("boom");
    }, "fallback")).toBe("fallback");
  });

  it("builds workspace inventory snapshots with counts and latest updates", () => {
    const snapshot = buildWorkspaceInventorySnapshot({
      users: [
        { workspaceId: "alpha", workspaceName: "Alpha", createdAt: "2026-04-09T00:00:00.000Z" },
        { workspaceId: "alpha", workspaceName: "Alpha", createdAt: "2026-04-09T00:01:00.000Z" },
        { workspaceId: "beta", workspaceName: "Beta", createdAt: "2026-04-09T00:02:00.000Z" },
        { workspaceId: "beta", workspaceName: "Beta", createdAt: "2026-04-09T00:03:00.000Z", status: "disabled" },
      ],
      routes: {
        alpha: [{ id: "route_1" }, { id: "route_2" }],
        beta: [{ id: "route_3" }],
      },
      briefs: {
        alpha: [{ id: "brief_1", updatedAt: "2026-04-09T01:00:00.000Z" }],
        beta: [{ id: "brief_2", createdAt: "2026-04-09T00:04:00.000Z" }],
      },
      reports: {
        alpha: [{ id: "report_1", createdAt: "2026-04-09T02:00:00.000Z" }],
      },
    });

    expect(snapshot.map((item: { workspaceId: string }) => item.workspaceId)).toEqual(["alpha", "beta"]);
    expect(snapshot[0]).toEqual(
      expect.objectContaining({
        workspaceId: "alpha",
        name: "Alpha",
        members: 2,
        routes: 2,
        briefs: 1,
        reports: 1,
        updatedAt: "2026-04-09T02:00:00.000Z",
      }),
    );
    expect(snapshot[1]).toEqual(
      expect.objectContaining({
        workspaceId: "beta",
        members: 1,
        routes: 1,
        briefs: 1,
        reports: 0,
      }),
    );
  });
});
