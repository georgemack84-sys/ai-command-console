import { describe, expect, it, vi } from "vitest";
import { createGovernedSourceRefreshActionExecutor } from "@/src/server/services/governed-source-refresh-action-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  name: "Manager",
  email: "manager@example.com",
  role: "admin",
};

describe("governed source refresh action service", () => {
  it("uses a collision-free network-mutation action ID", async () => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      result: { data: { job: { id: "job_1" } }, status: 202 },
      control: { decision: { decision: "auto_execute" } },
    });
    const execute = createGovernedSourceRefreshActionExecutor(executePlan);

    const result = await execute({ sourceId: "source_1", confirmed: true }, actor);

    expect(executePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "sources:refresh",
        originalRequest: "refresh",
        source: "source_refresh_api",
        reviewAcknowledged: true,
        payload: { sourceId: "source_1", confirmed: true },
      }),
      expect.objectContaining({ actor, modes: { confirmed: true } }),
    );
    expect(result).toEqual(expect.objectContaining({ data: { job: { id: "job_1" } }, status: 202 }));
  });

  it("stops unconfirmed network mutation before dispatch", async () => {
    const execute = createGovernedSourceRefreshActionExecutor(vi.fn().mockResolvedValue({
      ok: false,
      control: { decision: { decision: "confirm_required", explanation: "Confirmation required." } },
    }));

    await expect(execute({ sourceId: "source_1" }, actor)).resolves.toEqual(
      expect.objectContaining({ requiresConfirmation: true }),
    );
  });
});
