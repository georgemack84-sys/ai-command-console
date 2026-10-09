import { describe, expect, it, vi } from "vitest";
import {
  createGovernedOperationsActionExecutor,
  normalizeGovernedOperationsAction,
} from "@/src/server/services/governed-operations-action-service";

const actor = {
  id: "admin_1",
  workspaceId: "workspace_1",
  name: "Admin",
  email: "admin@example.com",
  role: "admin",
};

describe("governed operations action service", () => {
  it("normalizes workspace aliases before control review", async () => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      result: { action: "collaboration:automation-add-note", output: "Added note." },
      plan: { reviewStatus: "approved" },
      control: { decision: { decision: "auto_execute" } },
    });
    const execute = createGovernedOperationsActionExecutor(executePlan);

    const result = await execute(
      { action: "workspace:add-note", payload: { workspaceId: "workspace_1", note: "Ready." } },
      actor,
    );

    expect(normalizeGovernedOperationsAction("workspace:add-note")).toBe("collaboration:automation-add-note");
    expect(executePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "collaboration:automation-add-note",
        originalRequest: "workspace:add-note",
        meta: expect.objectContaining({ workspaceId: "workspace_1", userRole: "admin" }),
      }),
      expect.objectContaining({ modes: { confirmed: false } }),
    );
    expect(result).toEqual(expect.objectContaining({ action: "workspace:add-note", output: "Added note." }));
  });

  it("returns review evidence without dispatching confirmation-required work", async () => {
    const execute = createGovernedOperationsActionExecutor(
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

    await expect(
      execute({ action: "collaboration:delete-policy-playbook", payload: { playbookId: "playbook_1" } }, actor),
    ).resolves.toEqual(
      expect.objectContaining({
        action: "collaboration:delete-policy-playbook",
        requiresConfirmation: true,
        review: { reviewMode: "full" },
      }),
    );
  });

  it("passes explicit confirmation into the governed execution context", async () => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      result: "Completed.",
      plan: { reviewStatus: "approved" },
      control: { decision: { decision: "auto_execute" } },
    });
    const execute = createGovernedOperationsActionExecutor(executePlan);

    await execute(
      { action: "collaboration:delete-policy-playbook", payload: { playbookId: "playbook_1" }, confirmed: true },
      actor,
    );

    expect(executePlan).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ modes: { confirmed: true } }),
    );
  });

  it("fails closed when control blocks an operation", async () => {
    const execute = createGovernedOperationsActionExecutor(
      vi.fn().mockResolvedValue({
        ok: false,
        control: { decision: { decision: "blocked", explanation: "Blocked by policy." } },
      }),
    );

    await expect(execute({ action: "collaboration:automation-run-sweep", payload: {} }, actor)).rejects.toMatchObject({
      status: 403,
      code: "operations_action_blocked",
      message: "Blocked by policy.",
    });
  });
});
