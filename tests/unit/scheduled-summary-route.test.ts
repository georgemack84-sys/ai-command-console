import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceMember: vi.fn() }));
vi.mock("@/src/server/services/governed-scheduled-summary-action-service", () => ({
  executeGovernedScheduledSummaryAction: vi.fn(),
}));

import { POST } from "@/app/api/research/summaries/run-due/route";
import { getSessionUser } from "@/src/lib/auth";
import { executeGovernedScheduledSummaryAction } from "@/src/server/services/governed-scheduled-summary-action-service";

const user = {
  id: "user_1",
  email: "analyst@example.com",
  name: "Analyst",
  role: "operator",
  status: "active",
  workspaceId: "workspace_1",
  workspaceName: "Workspace",
};

const body = { views: [], schedules: [], scheduleId: "schedule_1", confirmed: true };

describe("scheduled summary route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue(user);
  });

  it("executes scheduled generation through governed admission", async () => {
    vi.mocked(executeGovernedScheduledSummaryAction).mockResolvedValue({
      data: { schedules: [], generated: [] },
    } as never);

    const response = await POST(new Request("http://localhost/api/research/summaries/run-due", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toEqual({ schedules: [], generated: [] });
    expect(executeGovernedScheduledSummaryAction).toHaveBeenCalledWith(body, user);
  });

  it("returns confirmation evidence before generation", async () => {
    vi.mocked(executeGovernedScheduledSummaryAction).mockResolvedValue({
      action: "run-due",
      output: "Confirmation required.",
      requiresConfirmation: true,
    } as never);

    const response = await POST(new Request("http://localhost/api/research/summaries/run-due", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ views: [], schedules: [] }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.requiresConfirmation).toBe(true);
  });
});
