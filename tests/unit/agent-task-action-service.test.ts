import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceMember: vi.fn() }));
vi.mock("@/src/server/agents/agent-service", () => ({ createAgentTask: vi.fn() }));
vi.mock("@/src/server/jobs/background-jobs", () => ({ queueBackgroundJob: vi.fn() }));

import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { createAgentTask } from "@/src/server/agents/agent-service";
import { queueBackgroundJob } from "@/src/server/jobs/background-jobs";
import { executeAgentTaskAction } from "@/src/server/services/agent-task-action-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  name: "Operator",
  email: "operator@example.com",
  role: "operator",
};

describe("agent task action service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates and immediately queues a workspace-scoped task", async () => {
    vi.mocked(createAgentTask).mockResolvedValue({ id: "task_1" } as never);
    vi.mocked(queueBackgroundJob).mockReturnValue({ id: "job_1" } as never);

    const result = await executeAgentTaskAction(
      { type: "research", input: { topic: "runtime" }, runNow: true },
      actor,
    );

    expect(requireWorkspaceMember).toHaveBeenCalledWith({
      userId: "user_1",
      userRole: "operator",
      workspaceId: "workspace_1",
    });
    expect(createAgentTask).toHaveBeenCalledWith({
      workspaceId: "workspace_1",
      type: "research",
      requestedById: "user_1",
      input: { topic: "runtime" },
    });
    expect(queueBackgroundJob).toHaveBeenCalledWith(
      "agent:execute",
      { taskId: "task_1", workspaceId: "workspace_1" },
      { actorId: "user_1", actorName: "Operator" },
      { admissionSource: "governed_agent_tasks_api" },
    );
    expect(result).toEqual({ data: { task: { id: "task_1" }, job: { id: "job_1" } }, status: 201 });
  });
});
