import { describe, expect, it, vi } from "vitest";
import { createGovernedResearchReportMutationExecutor } from "@/src/server/services/governed-research-report-mutation-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  name: "Analyst",
  email: "analyst@example.com",
  role: "operator",
};

describe("governed research report mutation service", () => {
  it.each([
    ["create", "research:reports-create"],
    ["update", "research:reports-update"],
    ["delete", "research:reports-delete"],
  ])("maps %s to a collision-free action ID", async (action, actionId) => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      result: { data: { reports: [] } },
      control: { decision: { decision: "auto_execute" } },
    });
    const execute = createGovernedResearchReportMutationExecutor(executePlan);

    await execute({ action, payload: { id: "report_1" }, confirmed: true }, actor);

    expect(executePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        action: actionId,
        originalRequest: action,
        source: "research_reports_api",
        payload: { id: "report_1" },
      }),
      expect.objectContaining({ actor, modes: { confirmed: true } }),
    );
  });

  it("returns confirmation evidence before mutation", async () => {
    const execute = createGovernedResearchReportMutationExecutor(vi.fn().mockResolvedValue({
      ok: false,
      control: { decision: { decision: "confirm_required", explanation: "Confirmation required." } },
    }));

    await expect(execute({ action: "delete", payload: { reportId: "report_1" } }, actor)).resolves.toEqual(
      expect.objectContaining({ action: "delete", requiresConfirmation: true }),
    );
  });
});
