import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/db/prisma", () => ({
  prisma: {
    agentTask: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    agentExecution: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/src/server/db/prisma";
import { createAgentTask, listAgentTasks, startAgentExecution, completeAgentExecution } from "@/src/server/agents/agent-service";
import { AppError } from "@/src/server/api/errors";

describe("agent service", () => {
  it("creates agent tasks", async () => {
    vi.mocked(prisma.agentTask.create).mockResolvedValue({ id: "task_1" } as never);
    const task = await createAgentTask({ workspaceId: "workspace", type: "monitor" });
    expect(task).toEqual(expect.objectContaining({ id: "task_1" }));
  });

  it("lists agent tasks", async () => {
    vi.mocked(prisma.agentTask.findMany).mockResolvedValue([{ id: "task_1" }] as never);
    const tasks = await listAgentTasks("workspace", 5);
    expect(tasks).toHaveLength(1);
  });

  it("throws when starting unknown task", async () => {
    vi.mocked(prisma.agentTask.findUnique).mockResolvedValue(null as never);
    await expect(startAgentExecution("missing")).rejects.toBeInstanceOf(AppError);
  });

  it("completes agent execution", async () => {
    vi.mocked(prisma.agentExecution.update).mockResolvedValue({ id: "exec_1", taskId: "task_1" } as never);
    vi.mocked(prisma.agentTask.update).mockResolvedValue({ id: "task_1" } as never);
    const execution = await completeAgentExecution({ executionId: "exec_1", status: "completed" });
    expect(execution).toEqual(expect.objectContaining({ id: "exec_1" }));
  });
});
