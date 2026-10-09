import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceMember: vi.fn() }));
vi.mock("@/src/server/services/summary-service", () => ({
  createSummaryReportForView: vi.fn(),
  generateSummaryForView: vi.fn(),
  isScheduleDue: vi.fn(),
}));

import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  createSummaryReportForView,
  generateSummaryForView,
  isScheduleDue,
} from "@/src/server/services/summary-service";
import { executeScheduledSummaryAction } from "@/src/server/services/scheduled-summary-action-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  name: "Analyst",
  email: "analyst@example.com",
  role: "operator",
} as const;

const view = { name: "Morning", filter: "all", sort: "recent", freshnessHours: 24 } as const;
const reportSchedule = {
  id: "schedule_report",
  viewName: "Morning",
  cadence: "daily-brief",
  destination: "report-draft",
} as const;
const memoSchedule = {
  id: "schedule_memo",
  viewName: "Morning",
  cadence: "weekly-review",
  destination: "clipboard-memo",
} as const;

describe("scheduled summary action service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("revalidates workspace authority and runs only the explicitly selected schedule", async () => {
    vi.mocked(createSummaryReportForView).mockResolvedValue({
      reportId: "report_1",
      title: "Morning summary",
      destination: "report-draft",
      provider: "test-provider",
      traceId: "trace_1",
    });

    const result = await executeScheduledSummaryAction({
      views: [view],
      schedules: [reportSchedule, memoSchedule],
      scheduleId: reportSchedule.id,
    }, actor);

    expect(requireWorkspaceMember).toHaveBeenCalledWith({
      userId: actor.id,
      userRole: actor.role,
      workspaceId: actor.workspaceId,
    });
    expect(createSummaryReportForView).toHaveBeenCalledWith(actor.workspaceId, view);
    expect(generateSummaryForView).not.toHaveBeenCalled();
    expect(isScheduleDue).not.toHaveBeenCalled();
    expect(result.data.generated).toEqual([
      expect.objectContaining({ scheduleId: reportSchedule.id, reportId: "report_1" }),
    ]);
    expect(result.data.schedules[0]?.lastRunAt).toEqual(expect.any(String));
    expect(result.data.schedules[1]).toEqual(memoSchedule);
  });

  it("runs due clipboard summaries without writing a report", async () => {
    vi.mocked(isScheduleDue).mockImplementation((schedule) => schedule.id === memoSchedule.id);
    vi.mocked(generateSummaryForView).mockResolvedValue({
      title: "Weekly memo",
      provider: "test-provider",
    } as never);

    const result = await executeScheduledSummaryAction({ views: [view], schedules: [reportSchedule, memoSchedule] }, actor);

    expect(generateSummaryForView).toHaveBeenCalledWith(actor.workspaceId, view);
    expect(createSummaryReportForView).not.toHaveBeenCalled();
    expect(result.data.generated).toEqual([
      expect.objectContaining({ scheduleId: memoSchedule.id, title: "Weekly memo", destination: "clipboard-memo" }),
    ]);
  });
});
