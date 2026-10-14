import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { requestWorkflowStepApproval } from "@/src/server/services/workflow-step-approval-service";

export async function POST(_request: Request, context: { params: Promise<{ workflowRunId: string; stepKey: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { workflowRunId, stepKey } = await context.params;
    return apiSuccess(await requestWorkflowStepApproval(user.workspaceId, user.id, { workflowRunId, stepKey }), { status: 201 });
  } catch (error) { return apiError(error, "Unable to request workflow step approval."); }
}
