import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { AppError } from "@/src/server/api/errors";
import { createAgentTask, listAgentTasks } from "@/src/server/agents/agent-service";
import { queueBackgroundJob } from "@/src/server/jobs/background-jobs";
import { isFeatureEnabled } from "@/src/server/feature-flags/feature-flag-service";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";

const createSchema = z.object({
  type: z.string().min(1),
  input: z.record(z.string(), z.unknown()).optional(),
  runNow: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });

    const url = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20)));
    const tasks = await listAgentTasks(user.workspaceId, limit);
    return apiSuccess({ tasks });
  } catch (error) {
    return apiError(error, "Unable to load agent tasks.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });

    const enabled = await isFeatureEnabled("agent_jobs", user.workspaceId);
    if (!enabled) {
      throw new AppError(403, "feature_disabled", "Agent jobs are not enabled for this workspace.");
    }

    const body = createSchema.parse(await request.json());
    const task = await createAgentTask({
      workspaceId: user.workspaceId,
      type: body.type,
      requestedById: user.id,
      input: body.input ?? null,
    });

    let job = null;
    if (body.runNow) {
      job = queueBackgroundJob(
        "agent:execute",
        { taskId: task.id, workspaceId: user.workspaceId },
        { actorId: user.id, actorName: user.name },
      );
    }

    return apiSuccess({ task, job }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create agent task.");
  }
}
