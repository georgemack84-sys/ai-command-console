import { z } from "zod";
import type { SessionUser } from "@/src/lib/types";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { createAgentTask } from "@/src/server/agents/agent-service";
import { queueBackgroundJob } from "@/src/server/jobs/background-jobs";

const agentTaskActionSchema = z.object({
  type: z.string().min(1),
  input: z.record(z.string(), z.unknown()).optional(),
  runNow: z.boolean().optional(),
});

type AgentTaskActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

export async function executeAgentTaskAction(input: unknown, actor: AgentTaskActor) {
  const body = agentTaskActionSchema.parse(input);
  await requireWorkspaceMember({
    userId: actor.id,
    userRole: actor.role,
    workspaceId: actor.workspaceId,
  });

  const task = await createAgentTask({
    workspaceId: actor.workspaceId,
    type: body.type,
    requestedById: actor.id,
    input: body.input ?? null,
  });

  const job = body.runNow
    ? queueBackgroundJob(
        "agent:execute",
        { taskId: task.id, workspaceId: actor.workspaceId },
        { actorId: actor.id, actorName: actor.name },
        { admissionSource: "governed_agent_tasks_api" },
      )
    : null;

  return { data: { task, job }, status: 201 };
}
