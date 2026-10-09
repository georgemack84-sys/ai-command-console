import { describe, expect, it, vi } from "vitest";
import {
  createGovernedResearchActionExecutor,
  normalizeGovernedResearchAction,
} from "@/src/server/services/governed-research-action-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  name: "Analyst",
  email: "analyst@example.com",
  role: "admin",
};

describe("governed research action service", () => {
  it.each([
    ["brief:route", "research:brief-route"],
    ["review:create", "research:review-create"],
    ["review:followup", "research:review-followup"],
    ["report:create", "research:report-create"],
    ["report:publish", "research:report-publish"],
  ])("normalizes %s to %s", (externalAction, internalAction) => {
    expect(normalizeGovernedResearchAction(externalAction)).toBe(internalAction);
  });

  it("rejects actions outside the research API allowlist before control routing", async () => {
    const executePlan = vi.fn();
    const execute = createGovernedResearchActionExecutor(executePlan);

    await expect(execute({ action: "approval:approve", payload: {} }, actor)).rejects.toMatchObject({
      status: 400,
      code: "research_action_unknown",
    });
    expect(executePlan).not.toHaveBeenCalled();
  });

  it("accepts only a literal boolean true as confirmation", async () => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      result: "Created review.",
      control: { decision: { decision: "auto_execute" } },
    });
    const execute = createGovernedResearchActionExecutor(executePlan);

    await execute({ action: "review:create", confirmed: "true" }, actor);

    expect(executePlan).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ modes: { confirmed: false } }));
  });

  it("assigns collision-free internal action IDs before control review", async () => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      result: "Created review.",
      plan: { reviewStatus: "approved" },
      control: { decision: { decision: "auto_execute" } },
    });
    const execute = createGovernedResearchActionExecutor(executePlan);

    const result = await execute({ action: "review:create", payload: { taskId: "task_1" }, confirmed: true }, actor);

    expect(normalizeGovernedResearchAction("review:create")).toBe("research:review-create");
    expect(executePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "research:review-create",
        originalRequest: "review:create",
        source: "research_api",
        meta: expect.objectContaining({ workspaceId: "workspace_1", userRole: "admin" }),
      }),
      expect.objectContaining({ modes: { confirmed: true } }),
    );
    expect(result).toEqual(expect.objectContaining({ action: "review:create", output: "Created review." }));
  });

  it("stops confirmation-required research work before dispatch", async () => {
    const execute = createGovernedResearchActionExecutor(
      vi.fn().mockResolvedValue({
        ok: false,
        plan: { reviewStatus: "approved" },
        review: { reviewMode: "full" },
        control: {
          decision: {
            decision: "confirm_required",
            explanation: "Control review requires confirmation before execution.",
          },
        },
      }),
    );

    await expect(execute({ action: "report:publish", payload: { reportId: "report_1" } }, actor)).resolves.toEqual(
      expect.objectContaining({
        action: "report:publish",
        requiresConfirmation: true,
        review: { reviewMode: "full" },
      }),
    );
  });

  it("fails closed when control blocks a research action", async () => {
    const execute = createGovernedResearchActionExecutor(
      vi.fn().mockResolvedValue({
        ok: false,
        control: { decision: { decision: "blocked", explanation: "Blocked by policy." } },
      }),
    );

    await expect(execute({ action: "brief:route", payload: { briefId: "brief_1" } }, actor)).rejects.toMatchObject({
      status: 403,
      code: "research_action_blocked",
      message: "Blocked by policy.",
    });
  });
});
