import { describe, expect, it, vi } from "vitest";
import { createGovernedScheduledSummaryActionExecutor } from "@/src/server/services/governed-scheduled-summary-action-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  name: "Analyst",
  email: "analyst@example.com",
  role: "operator",
};

describe("governed scheduled summary action service", () => {
  it("uses a collision-free network-mutation action with explicit acknowledgement", async () => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      result: { data: { schedules: [], generated: [] } },
      control: { decision: { decision: "auto_execute" } },
    });
    const execute = createGovernedScheduledSummaryActionExecutor(executePlan);
    const input = { views: [], schedules: [], scheduleId: "schedule_1", confirmed: true };

    await execute(input, actor);

    expect(executePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "research:summaries-run-due",
        originalRequest: "run-due",
        source: "scheduled_summary_api",
        reviewAcknowledged: true,
        payload: input,
      }),
      expect.objectContaining({ actor, modes: { confirmed: true } }),
    );
  });

  it("returns confirmation evidence before dispatch", async () => {
    const execute = createGovernedScheduledSummaryActionExecutor(vi.fn().mockResolvedValue({
      ok: false,
      control: { decision: { decision: "confirm_required", explanation: "Confirmation required." } },
    }));

    await expect(execute({ views: [], schedules: [] }, actor)).resolves.toEqual(
      expect.objectContaining({ requiresConfirmation: true }),
    );
  });
});
