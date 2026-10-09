import { describe, expect, it, vi } from "vitest";
import {
  createGovernedJobActionExecutor,
  normalizeGovernedJobAction,
} from "@/src/server/services/governed-job-action-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  name: "Operator",
  email: "operator@example.com",
  role: "operator",
};

describe("governed job action service", () => {
  it.each([
    ["workspace:generate-insights", "jobs:workspace-generate-insights"],
    ["workspace:failure-drill", "jobs:workspace-failure-drill"],
    ["workspace:generate-summary", "jobs:workspace-generate-summary"],
    ["job:cancel", "jobs:cancel"],
    ["job:retry", "jobs:retry"],
  ])("normalizes %s to %s", (externalAction, internalAction) => {
    expect(normalizeGovernedJobAction(externalAction)).toBe(internalAction);
  });

  it("rejects actions outside the jobs allowlist before control routing", async () => {
    const executePlan = vi.fn();
    const execute = createGovernedJobActionExecutor(executePlan);

    await expect(execute({ type: "source:refresh" }, actor)).rejects.toMatchObject({
      status: 400,
      code: "job_action_unknown",
    });
    expect(executePlan).not.toHaveBeenCalled();
  });

  it("uses collision-free internal IDs and preserves payload and confirmation", async () => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      result: { data: { job: { id: "job_1" } }, status: 202 },
      control: { decision: { decision: "auto_execute" } },
    });
    const execute = createGovernedJobActionExecutor(executePlan);

    const result = await execute({ type: "workspace:generate-insights", confirmed: true }, actor);

    expect(executePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "jobs:workspace-generate-insights",
        originalRequest: "workspace:generate-insights",
        source: "jobs_api",
        payload: expect.objectContaining({ type: "workspace:generate-insights" }),
      }),
      expect.objectContaining({ actor, modes: { confirmed: true } }),
    );
    expect(result).toEqual(expect.objectContaining({ data: { job: { id: "job_1" } }, status: 202 }));
  });

  it("stops confirmation-required work before dispatch", async () => {
    const execute = createGovernedJobActionExecutor(vi.fn().mockResolvedValue({
      ok: false,
      control: { decision: { decision: "confirm_required", explanation: "Confirmation required." } },
    }));

    await expect(execute({ type: "job:cancel", jobId: "job_1" }, actor)).resolves.toEqual(
      expect.objectContaining({ action: "job:cancel", requiresConfirmation: true }),
    );
  });
});
