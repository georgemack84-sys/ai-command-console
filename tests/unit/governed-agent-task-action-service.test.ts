import { describe, expect, it, vi } from "vitest";
import {
  createGovernedAgentTaskActionExecutor,
  normalizeGovernedAgentTaskAction,
} from "@/src/server/services/governed-agent-task-action-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  name: "Operator",
  email: "operator@example.com",
  role: "operator",
};

describe("governed agent task action service", () => {
  it("uses a collision-free internal action ID", () => {
    expect(normalizeGovernedAgentTaskAction("create")).toBe("agent-tasks:create");
    expect(() => normalizeGovernedAgentTaskAction("delete")).toThrow("Unknown agent task action");
  });

  it("preserves the typed payload and confirmation", async () => {
    const executePlan = vi.fn().mockResolvedValue({
      ok: true,
      result: { data: { task: { id: "task_1" }, job: null }, status: 201 },
      control: { decision: { decision: "auto_execute" } },
    });
    const execute = createGovernedAgentTaskActionExecutor(executePlan);

    const result = await execute({ type: "research", runNow: false, confirmed: true }, actor);

    expect(executePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "agent-tasks:create",
        originalRequest: "create",
        source: "agent_tasks_api",
        payload: { type: "research", runNow: false, confirmed: true },
      }),
      expect.objectContaining({ actor, modes: { confirmed: true } }),
    );
    expect(result).toEqual(expect.objectContaining({ data: { task: { id: "task_1" }, job: null }, status: 201 }));
  });
});
