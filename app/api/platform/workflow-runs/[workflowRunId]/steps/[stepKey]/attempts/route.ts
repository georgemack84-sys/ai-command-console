import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { beginWorkflowStepAttempt } from "@/src/server/services/workflow-execution-state-service";

export async function POST(request: Request, context: { params: Promise<{ workflowRunId: string; stepKey: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { workflowRunId, stepKey } = await context.params;
    const body = await request.json();
    return apiSuccess(await beginWorkflowStepAttempt(user.workspaceId, { ...body, workflowRunId, stepKey }), { status: 202 });
  } catch (error) { return apiError(error, "Unable to authorize workflow step attempt."); }
}
