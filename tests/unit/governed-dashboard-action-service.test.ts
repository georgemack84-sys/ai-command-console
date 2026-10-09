import { describe, expect, it, vi } from "vitest";
import {
  createGovernedDashboardActionExecutor,
  normalizeGovernedDashboardAction,
} from "@/src/server/services/governed-dashboard-action-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  name: "Operator",
  email: "operator@example.com",
  role: "admin",
};

describe("governed dashboard action service", () => {
  it.each([
    ["alert:run-checks", "dashboard:alert-run-checks"],
    ["alert:acknowledge", "dashboard:alert-acknowledge"],
    ["workspace:generate-summary", "dashboard:workspace-generate-summary"],
  ])("normalizes %s to %s", (externalAction, internalAction) => {
    expect(normalizeGovernedDashboardAction(externalAction)).toBe(internalAction);
  });

  it("rejects actions outside the dashboard API allowlist before control routing", async () => {
    const executePlan = vi.fn();
    const execute = createGovernedDashboardActionExecutor(executePlan);

    await expect(execute({ action: "approval:approve", payload: {} }, actor)).rejects.toMatchObject({
      status: 400,
      code: "dashboard_action_unknown",
    });
    expect(executePlan).not.toHaveBeenCalled();
  });

  it("assigns collision-free internal action IDs before control review", async () => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      result: "Acknowledged alert.",
      plan: { reviewStatus: "approved" },
      control: { decision: { decision: "auto_execute" } },
    });
    const execute = createGovernedDashboardActionExecutor(executePlan);

    const result = await execute(
      { action: "alert:acknowledge", payload: { alertId: "alert_1", owner: "dashboard" }, confirmed: true },
      actor,
    );

    expect(executePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "dashboard:alert-acknowledge",
        originalRequest: "alert:acknowledge",
        source: "dashboard_api",
        meta: expect.objectContaining({ workspaceId: "workspace_1", userRole: "admin" }),
      }),
      expect.objectContaining({ modes: { confirmed: true } }),
    );
    expect(result).toEqual(expect.objectContaining({ action: "alert:acknowledge", output: "Acknowledged alert." }));
  });

  it("stops confirmation-required dashboard work before dispatch", async () => {
    const execute = createGovernedDashboardActionExecutor(
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

    await expect(execute({ action: "workspace:generate-summary", payload: {} }, actor)).resolves.toEqual(
      expect.objectContaining({
        action: "workspace:generate-summary",
        requiresConfirmation: true,
        review: { reviewMode: "full" },
      }),
    );
  });

  it("accepts only a literal boolean true as confirmation", async () => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      result: "Checks complete.",
      control: { decision: { decision: "auto_execute" } },
    });
    const execute = createGovernedDashboardActionExecutor(executePlan);

    await execute({ action: "alert:run-checks", confirmed: "true" }, actor);

    expect(executePlan).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ modes: { confirmed: false } }));
  });
});
