import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { recoverWorkflowStepForRetry } from "@/src/server/services/workflow-execution-state-service";

/** Recovery only reopens admission; a fresh credential is still required to dispatch. */
export async function POST(_request: Request, context: { params: Promise<{ workflowRunId: string; stepKey: string; stepRunId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { workflowRunId, stepKey, stepRunId } = await context.params;
    const result = await recoverWorkflowStepForRetry(user.workspaceId, stepRunId);
    if (result.workflowRunId !== workflowRunId || result.stepKey !== stepKey) throw new AppError(404, "workflow_step_not_found", "Workflow step was not found for this run.");
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, "Unable to prepare the workflow step for retry.");
  }
}
