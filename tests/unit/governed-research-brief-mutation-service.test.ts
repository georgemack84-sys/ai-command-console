import { describe, expect, it, vi } from "vitest";
import { createGovernedResearchBriefMutationExecutor } from "@/src/server/services/governed-research-brief-mutation-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  name: "Analyst",
  email: "analyst@example.com",
  role: "operator",
};

describe("governed research brief mutation service", () => {
  it.each([
    ["create", "research:briefs-create"],
    ["update", "research:briefs-update"],
    ["route", "research:briefs-route"],
    ["delete", "research:briefs-delete"],
  ])("maps %s to a collision-free action ID", async (action, actionId) => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      result: { data: { briefs: [] } },
      control: { decision: { decision: "auto_execute" } },
    });
    const execute = createGovernedResearchBriefMutationExecutor(executePlan);

    await execute({ action, payload: { id: "brief_1" }, confirmed: true }, actor);

    expect(executePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        action: actionId,
        originalRequest: action,
        source: "research_briefs_api",
        payload: { id: "brief_1" },
      }),
      expect.objectContaining({ actor, modes: { confirmed: true } }),
    );
  });

  it("returns confirmation evidence before mutation", async () => {
    const execute = createGovernedResearchBriefMutationExecutor(vi.fn().mockResolvedValue({
      ok: false,
      control: { decision: { decision: "confirm_required", explanation: "Confirmation required." } },
    }));

    await expect(execute({ action: "delete", payload: { briefId: "brief_1" } }, actor)).resolves.toEqual(
      expect.objectContaining({ action: "delete", requiresConfirmation: true }),
    );
  });
});
