import { describe, expect, it, vi } from "vitest";
import {
  createGovernedAdminAccessActionExecutor,
  normalizeGovernedAdminAccessAction,
} from "@/src/server/services/governed-admin-access-action-service";

const actor = {
  id: "admin_1",
  workspaceId: "workspace_1",
  name: "Admin",
  email: "admin@example.com",
  role: "admin",
};

describe("governed admin access action service", () => {
  it.each([
    ["user-role", "admin:user-role"],
    ["user-status", "admin:user-status"],
    ["user-workspace", "admin:user-workspace"],
    ["workspace-rename", "admin:workspace-rename"],
    ["workspace-invite", "admin:workspace-invite"],
    ["workspace-invite-revoke", "admin:workspace-invite-revoke"],
    ["workspace-policy", "admin:workspace-policy"],
    ["governance", "admin:governance"],
    ["ai-summary-check", "admin:ai-summary-check"],
  ])("normalizes %s to %s", (externalAction, internalAction) => {
    expect(normalizeGovernedAdminAccessAction(externalAction)).toBe(internalAction);
  });

  it("rejects actions outside the admin allowlist before control routing", async () => {
    const executePlan = vi.fn();
    const execute = createGovernedAdminAccessActionExecutor(executePlan);

    await expect(execute({ type: "approval:approve" }, actor)).rejects.toMatchObject({
      status: 400,
      code: "admin_action_unknown",
    });
    expect(executePlan).not.toHaveBeenCalled();
  });

  it("assigns collision-free internal IDs and preserves the full typed payload", async () => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      result: { data: { user: { id: "user_2", role: "admin" } } },
      control: { decision: { decision: "auto_execute" } },
    });
    const execute = createGovernedAdminAccessActionExecutor(executePlan);

    const result = await execute({ type: "user-role", userId: "user_2", role: "admin", confirmed: true }, actor);

    expect(executePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin:user-role",
        originalRequest: "user-role",
        source: "admin_access_api",
        payload: expect.objectContaining({ type: "user-role", userId: "user_2", role: "admin" }),
      }),
      expect.objectContaining({ actor, modes: { confirmed: true } }),
    );
    expect(result).toEqual(expect.objectContaining({ data: { user: { id: "user_2", role: "admin" } } }));
  });

  it("stops confirmation-required admin work before dispatch", async () => {
    const execute = createGovernedAdminAccessActionExecutor(
      vi.fn().mockResolvedValue({
        ok: false,
        control: {
          decision: {
            decision: "confirm_required",
            explanation: "Control review requires confirmation before execution.",
          },
        },
      }),
    );

    await expect(execute({ type: "user-status", userId: "user_2", status: "disabled" }, actor)).resolves.toEqual(
      expect.objectContaining({ action: "user-status", requiresConfirmation: true }),
    );
  });
});
