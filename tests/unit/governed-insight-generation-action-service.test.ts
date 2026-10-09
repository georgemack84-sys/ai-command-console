import { describe, expect, it, vi } from "vitest";
import { createGovernedInsightGenerationActionExecutor } from "@/src/server/services/governed-insight-generation-action-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  name: "Analyst",
  email: "analyst@example.com",
  role: "operator",
};

describe("governed insight generation action service", () => {
  it.each([
    ["generate-direct", "research:insights-generate-direct"],
    ["generate-queued", "research:insights-generate-queued"],
  ])("maps %s to a collision-free governed action", async (action, routedAction) => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      result: { data: {}, status: 201 },
      control: { decision: { decision: "auto_execute" } },
    });
    const execute = createGovernedInsightGenerationActionExecutor(executePlan);

    await execute({ action, payload: { confirmed: true }, confirmed: true }, actor);

    expect(executePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        action: routedAction,
        originalRequest: action,
        source: "insights_api",
        payload: { confirmed: true },
      }),
      expect.objectContaining({ actor, modes: { confirmed: true } }),
    );
  });

  it("returns confirmation evidence before dispatch", async () => {
    const execute = createGovernedInsightGenerationActionExecutor(vi.fn().mockResolvedValue({
      ok: false,
      control: { decision: { decision: "confirm_required", explanation: "Confirmation required." } },
    }));

    await expect(execute({ action: "generate-queued", payload: {} }, actor)).resolves.toEqual(
      expect.objectContaining({ requiresConfirmation: true }),
    );
  });
});
