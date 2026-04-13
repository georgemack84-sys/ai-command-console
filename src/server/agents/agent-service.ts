import type { Prisma } from "@prisma/client";
import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";

export async function createAgentTask(input: {
  workspaceId: string;
  type: string;
  requestedById?: string | null;
  input?: Record<string, unknown> | null;
}) {
  const payload = input.input ? (input.input as Prisma.InputJsonValue) : undefined;
  return prisma.agentTask.create({
    data: {
      workspaceId: input.workspaceId,
      type: input.type,
      status: "queued",
      input: payload,
      requestedById: input.requestedById ?? null,
    },
  });
}

export async function listAgentTasks(workspaceId: string, limit = 20) {
  return prisma.agentTask.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function startAgentExecution(taskId: string, metadata?: Record<string, unknown>) {
  const task = await prisma.agentTask.findUnique({
    where: { id: taskId },
  });
  if (!task) {
    throw new AppError(404, "agent_task_not_found", "Agent task not found.");
  }

  await prisma.agentTask.update({
    where: { id: taskId },
    data: { status: "running" },
  });

  return prisma.agentExecution.create({
    data: {
      taskId,
      status: "running",
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function completeAgentExecution(input: {
  executionId: string;
  status: "completed" | "failed";
  output?: Record<string, unknown> | null;
  error?: string | null;
}) {
  const execution = await prisma.agentExecution.update({
    where: { id: input.executionId },
    data: {
      status: input.status,
      completedAt: new Date(),
      error: input.error ?? null,
      metadata: input.output ? (input.output as Prisma.InputJsonValue) : undefined,
    },
  });

  await prisma.agentTask.update({
    where: { id: execution.taskId },
    data: {
      status: input.status === "completed" ? "completed" : "failed",
      output: input.output ? (input.output as Prisma.InputJsonValue) : undefined,
    },
  });

  return execution;
}
